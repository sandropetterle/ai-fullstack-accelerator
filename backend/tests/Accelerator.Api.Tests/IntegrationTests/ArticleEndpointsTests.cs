using System.Net;
using System.Net.Http.Json;
using Accelerator.Api.DTOs;
using Accelerator.Api.Tests.Helpers;
using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using Accelerator.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Accelerator.Api.Tests.IntegrationTests;

public class ArticleEndpointsTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly IServiceScope _scope;
    private readonly ApplicationDbContext _context;
    private static readonly string DatabaseName = $"TestDb_{Guid.NewGuid()}";

    public ArticleEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase(DatabaseName));

                services.AddAuthentication(TestAuthHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
            });
        });

        _client = _factory.CreateClient();
        _scope = _factory.Services.CreateScope();
        _context = _scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (!_context.Articles.Any())
            SeedTestData();
    }

    private static HttpRequestMessage AdminRequest(HttpMethod method, string url, HttpContent? content = null)
    {
        var req = new HttpRequestMessage(method, url).WithRole("Admin");
        if (content != null) req.Content = content;
        return req;
    }

    private static HttpRequestMessage EditorRequest(HttpMethod method, string url, HttpContent? content = null)
    {
        var req = new HttpRequestMessage(method, url).WithRole("Editor");
        if (content != null) req.Content = content;
        return req;
    }

    [Fact]
    public async Task GetArticles_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/articles?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResponse<ArticleListDto>>();
        result!.Items.Should().NotBeEmpty();
        result.CurrentPage.Should().Be(1);
    }

    [Fact]
    public async Task GetArticles_ShouldFilterByCategory()
    {
        var response = await _client.GetAsync("/api/articles?category=Guide");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResponse<ArticleListDto>>();
        result!.Items.Should().OnlyContain(a => a.Category == "Guide");
    }

    [Fact]
    public async Task GetArticles_ShouldFilterByTags()
    {
        var response = await _client.GetAsync("/api/articles?tags=Testing");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResponse<ArticleListDto>>();
        result!.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(a => a.Tags.Contains("Testing"));
    }

    [Fact]
    public async Task GetArticles_ShouldSearchByTitleOrDescription()
    {
        var response = await _client.GetAsync("/api/articles?search=Test");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResponse<ArticleListDto>>();
        result!.Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetArticles_ShouldSortByVotes()
    {
        var response = await _client.GetAsync("/api/articles?sortBy=votes");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResponse<ArticleListDto>>();
        result!.Items.Should().BeInDescendingOrder(a => a.VoteCount);
    }

    [Fact]
    public async Task GetFeaturedArticles_ShouldReturnOnlyFeatured()
    {
        var response = await _client.GetAsync("/api/articles/featured");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ArticleListDto>>();
        result.Should().NotBeEmpty();
        result.Should().OnlyContain(a => a.IsFeatured);
    }

    [Fact]
    public async Task GetTrendingArticles_ShouldReturnOnlyTrending()
    {
        var response = await _client.GetAsync("/api/articles/trending");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ArticleListDto>>();
        result.Should().NotBeEmpty();
        result.Should().OnlyContain(a => a.IsTrending);
    }

    [Fact]
    public async Task GetArticleBySlug_ShouldReturnArticle()
    {
        var article = CreateTestArticle("Test Article", "test-slug");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        var response = await _client.GetAsync("/api/articles/test-slug");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ArticleDetailDto>();
        result!.Slug.Should().Be("test-slug");
    }

    [Fact]
    public async Task GetArticleBySlug_ShouldReturn404WhenNotFound()
    {
        var response = await _client.GetAsync("/api/articles/nonexistent-slug");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task VoteForArticle_ShouldIncrementVoteCount()
    {
        var article = CreateTestArticle("Vote Test", "vote-test");
        article.VoteCount = 10;
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        var response = await _client.PostAsync($"/api/articles/{article.Id}/vote", null);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<VoteResponse>();
        result!.VoteCount.Should().Be(11);
    }

    [Fact]
    public async Task VoteForArticle_ShouldReturn404WhenNotFound()
    {
        var response = await _client.PostAsync($"/api/articles/{Guid.NewGuid()}/vote", null);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetRelatedArticles_ShouldReturn200WithRelatedArticles()
    {
        // guide-article-test is Guide — high-votes (Tutorial) shares archTag
        var response = await _client.GetAsync("/api/articles/guide-article-test/related");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ArticleListDto>>();
        result.Should().NotBeNull();
        result.Should().NotContain(a => a.Slug == "guide-article-test");
    }

    [Fact]
    public async Task GetRelatedArticles_ShouldReturn200WithEmptyListForUnknownSlug()
    {
        var response = await _client.GetAsync("/api/articles/nonexistent-slug/related");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ArticleListDto>>();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateArticle_ShouldCreateNewArticle()
    {
        var dto = new CreateArticleDto
        {
            Title = "New Article", ShortDescription = "Desc", FullContent = "Content",
            Category = "Guide", Author = "Author", Tags = new List<string> { "Testing", "New" }
        };
        var response = await _client.SendAsync(EditorRequest(HttpMethod.Post, "/api/articles", JsonContent.Create(dto)));
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<ArticleDetailDto>();
        result!.Title.Should().Be("New Article");
        result.Tags.Should().Contain("Testing");
    }

    [Fact]
    public async Task CreateArticle_ShouldReturn400ForInvalidCategory()
    {
        var dto = new CreateArticleDto
        {
            Title = "A", ShortDescription = "D", Category = "InvalidCategory", Tags = new List<string>()
        };
        var response = await _client.SendAsync(EditorRequest(HttpMethod.Post, "/api/articles", JsonContent.Create(dto)));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateArticle_ShouldReturn401WhenUnauthenticated()
    {
        var dto = new CreateArticleDto
        {
            Title = "A", ShortDescription = "D", Category = "Guide", Tags = new List<string>()
        };
        var response = await _client.PostAsJsonAsync("/api/articles", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateArticle_ShouldUpdateExistingArticle()
    {
        var article = CreateTestArticle("Original Title", "original-slug");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        var dto = new UpdateArticleDto
        {
            Title = "Updated Title", ShortDescription = "Updated", FullContent = "Updated content",
            Category = "Tutorial", Author = "Author", IsFeatured = true, IsTrending = true,
            Tags = new List<string> { "Testing" }
        };
        var response = await _client.SendAsync(EditorRequest(HttpMethod.Put, $"/api/articles/{article.Id}", JsonContent.Create(dto)));
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ArticleDetailDto>();
        result!.Title.Should().Be("Updated Title");
        result.IsFeatured.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateArticle_ShouldReturn404WhenNotFound()
    {
        var dto = new UpdateArticleDto
        {
            Title = "T", ShortDescription = "D", Category = "Guide", Tags = new List<string>()
        };
        var response = await _client.SendAsync(EditorRequest(HttpMethod.Put, $"/api/articles/{Guid.NewGuid()}", JsonContent.Create(dto)));
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateArticle_ShouldReturn401WhenUnauthenticated()
    {
        var dto = new UpdateArticleDto
        {
            Title = "T", ShortDescription = "D", Category = "Guide", Tags = new List<string>()
        };
        var response = await _client.PutAsJsonAsync($"/api/articles/{Guid.NewGuid()}", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteArticle_ShouldDeleteArticle()
    {
        var article = CreateTestArticle("To Delete", "to-delete");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        var response = await _client.SendAsync(AdminRequest(HttpMethod.Delete, $"/api/articles/{article.Id}"));
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        _context.ChangeTracker.Clear();
        (await _context.Articles.FindAsync(article.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteArticle_ShouldReturn404WhenNotFound()
    {
        var response = await _client.SendAsync(AdminRequest(HttpMethod.Delete, $"/api/articles/{Guid.NewGuid()}"));
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteArticle_ShouldReturn401WhenUnauthenticated()
    {
        var response = await _client.DeleteAsync($"/api/articles/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteArticle_ShouldReturn403WhenEditorTriesToDelete()
    {
        var article = CreateTestArticle("Cannot Delete", "cannot-delete");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        var response = await _client.SendAsync(EditorRequest(HttpMethod.Delete, $"/api/articles/{article.Id}"));
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private void SeedTestData()
    {
        var testingTag = new Tag { Id = Guid.NewGuid(), Name = "Testing" };
        var archTag = new Tag { Id = Guid.NewGuid(), Name = "Architecture" };
        var generalTag = new Tag { Id = Guid.NewGuid(), Name = "General" };
        _context.Tags.AddRange(testingTag, archTag, generalTag);
        _context.SaveChanges();

        _context.Articles.AddRange(
            CreateTestArticle("Guide Article Test", "guide-article-test", ArticleCategory.Guide, 50, true, false, new[] { archTag }),
            CreateTestArticle("Tutorial with Testing", "tutorial-testing", ArticleCategory.Tutorial, 40, false, true, new[] { testingTag }),
            CreateTestArticle("General Test Article", "general-test", ArticleCategory.General, 35, false, true, new[] { generalTag }),
            CreateTestArticle("High Votes Article", "high-votes", ArticleCategory.Tutorial, 100, false, false, new[] { archTag }),
            CreateTestArticle("Featured and Trending", "featured-trending", ArticleCategory.Reference, 75, true, true, new[] { testingTag, archTag })
        );
        _context.SaveChanges();
    }

    private Article CreateTestArticle(
        string title, string slug,
        ArticleCategory category = ArticleCategory.Guide,
        int voteCount = 0, bool isFeatured = false, bool isTrending = false,
        Tag[]? tags = null) => new Article
    {
        Id = Guid.NewGuid(), Title = title, Slug = slug,
        ShortDescription = $"Description for {title}", FullContent = $"Full content for {title}",
        Category = category, Author = "Test Author",
        CreatedDate = DateTime.UtcNow, UpdatedDate = DateTime.UtcNow,
        VoteCount = voteCount, Status = ArticleStatus.Published,
        IsFeatured = isFeatured, IsTrending = isTrending,
        Tags = tags?.ToList() ?? new List<Tag>()
    };

    public void Dispose()
    {
        _scope?.Dispose();
        _context?.Dispose();
    }
}
