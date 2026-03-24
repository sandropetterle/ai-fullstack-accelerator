using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using Accelerator.Data;
using Accelerator.Data.Repositories;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace Accelerator.Integration.Tests.Repositories;

public class ArticleRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ArticleRepository _sut;

    public ArticleRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _sut = new ArticleRepository(_context);

        // Seed test data
        SeedTestData();
    }

    #region GetArticlesAsync Tests

    [Fact]
    public async Task GetArticlesAsync_ShouldReturnPaginatedResults()
    {
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, null, null);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCountGreaterThan(0);
        result.CurrentPage.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldFilterByCategory()
    {
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, "Guide", null, null);

        // Assert
        result.Items.Should().OnlyContain(a => a.Category == ArticleCategory.Guide);
        result.Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldFilterByTags()
    {
        // Arrange
        var tags = new List<string> { "Testing" };

        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, tags, null);

        // Assert
        result.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(a => a.Tags.Any(t => tags.Contains(t.Name)));
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldSearchByTitle()
    {
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, null, "Guide");

        // Assert
        result.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(a =>
            a.Title.Contains("Guide", StringComparison.OrdinalIgnoreCase) ||
            a.ShortDescription.Contains("Guide", StringComparison.OrdinalIgnoreCase) ||
            a.Tags.Any(t => t.Name.Contains("Guide", StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public async Task GetArticlesAsync_WithSearchTerm_SearchesFullContent()
    {
        // Arrange - Add an article with unique content only in FullContent
        var article = CreateArticle("Regular Title", "full-content-search-slug");
        article.FullContent = "UniqueFullContentToken12345";
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, null, "UniqueFullContentToken12345");

        // Assert
        result.Items.Should().NotBeEmpty();
        result.Items.Should().Contain(a => a.Slug == "full-content-search-slug");
    }

    [Fact]
    public async Task GetArticlesAsync_WithSearchTerm_SearchesTags()
    {
        // Arrange - tag3 is "Performance", seeded in SeedTestData
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, null, "Performance");

        // Assert
        result.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(a =>
            a.Title.Contains("Performance", StringComparison.OrdinalIgnoreCase) ||
            a.ShortDescription.Contains("Performance", StringComparison.OrdinalIgnoreCase) ||
            a.Tags.Any(t => t.Name.Contains("Performance", StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public async Task GetArticlesAsync_WithDateRange_FiltersCorrectly()
    {
        // Arrange
        var oldArticle = CreateArticle("Old Article", "old-article");
        oldArticle.CreatedDate = DateTime.UtcNow.AddDays(-30);
        var newArticle = CreateArticle("New Article", "new-article");
        newArticle.CreatedDate = DateTime.UtcNow.AddDays(-1);
        _context.Articles.AddRange(oldArticle, newArticle);
        await _context.SaveChangesAsync();

        var from = DateTime.UtcNow.AddDays(-7);
        var to = DateTime.UtcNow;

        // Act
        var result = await _sut.GetArticlesAsync(1, 100, null, null, null, null, from, to);

        // Assert
        result.Items.Should().Contain(a => a.Slug == "new-article");
        result.Items.Should().NotContain(a => a.Slug == "old-article");
    }

    [Fact]
    public async Task GetArticlesAsync_WithDateFrom_OnlyReturnsNewerArticles()
    {
        // Arrange
        var oldArticle = CreateArticle("Old Article B", "old-article-b");
        oldArticle.CreatedDate = DateTime.UtcNow.AddDays(-60);
        _context.Articles.Add(oldArticle);
        await _context.SaveChangesAsync();

        var from = DateTime.UtcNow.AddDays(-10);

        // Act
        var result = await _sut.GetArticlesAsync(1, 100, null, null, null, null, from);

        // Assert
        result.Items.Should().NotContain(a => a.Slug == "old-article-b");
    }

    [Fact]
    public async Task GetArticlesAsync_WithTagModeAll_RequiresAllTags()
    {
        // Arrange - seeded: "Guide Article 1" has tag "Architecture"
        // "Tutorial with Testing" has tag "Testing"
        // No article has both "Architecture" AND "Testing"
        var tags = new List<string> { "Architecture", "Testing" };

        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, tags, null, tagMode: "all");

        // Assert
        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetArticlesAsync_WithTagModeAll_ReturnsArticleWithAllTags()
    {
        // Arrange - create an article that has BOTH tags
        var tag1 = _context.Tags.First(t => t.Name == "Architecture");
        var tag2 = _context.Tags.First(t => t.Name == "Testing");
        var multiTagArticle = CreateArticle("Multi Tag Article", "multi-tag-article", tags: new[] { tag1, tag2 });
        _context.Articles.Add(multiTagArticle);
        await _context.SaveChangesAsync();

        var tags = new List<string> { "Architecture", "Testing" };

        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, tags, null, tagMode: "all");

        // Assert
        result.Items.Should().Contain(a => a.Slug == "multi-tag-article");
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldSortByVotes()
    {
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, "votes", null, null, null);

        // Assert
        result.Items.Should().BeInDescendingOrder(a => a.VoteCount);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldSortAlphabetically()
    {
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, "alphabetical", null, null, null);

        // Assert
        result.Items.Should().BeInAscendingOrder(a => a.Title);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldSortByNewestByDefault()
    {
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, null, null);

        // Assert
        result.Items.Should().BeInDescendingOrder(a => a.CreatedDate);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldPaginateCorrectly()
    {
        // Act
        var page1 = await _sut.GetArticlesAsync(1, 2, null, null, null, null);
        var page2 = await _sut.GetArticlesAsync(2, 2, null, null, null, null);

        // Assert
        page1.Items.Should().HaveCount(2);
        page2.Items.Should().NotBeEmpty();
        page1.Items.Should().NotIntersectWith(page2.Items);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldOnlyReturnPublishedArticles()
    {
        // Arrange - Add a draft article
        var draftArticle = CreateArticle("Draft Article", "draft-article");
        draftArticle.Status = ArticleStatus.Draft;
        _context.Articles.Add(draftArticle);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetArticlesAsync(1, 100, null, null, null, null);

        // Assert
        result.Items.Should().OnlyContain(a => a.Status == ArticleStatus.Published);
        result.Items.Should().NotContain(a => a.Id == draftArticle.Id);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldIncludeTags()
    {
        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, null, null);

        // Assert
        result.Items.Should().NotBeEmpty();
        result.Items.First().Tags.Should().NotBeNull();
    }

    #endregion

    #region GetBySlugAsync Tests

    [Fact]
    public async Task GetBySlugAsync_ShouldReturnArticle()
    {
        // Arrange
        var article = CreateArticle("Test Article", "test-article-slug");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetBySlugAsync("test-article-slug");

        // Assert
        result.Should().NotBeNull();
        result!.Slug.Should().Be("test-article-slug");
        result.Tags.Should().NotBeNull();
    }

    [Fact]
    public async Task GetBySlugAsync_ShouldReturnNullWhenNotFound()
    {
        // Act
        var result = await _sut.GetBySlugAsync("nonexistent-slug");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetBySlugAsync_ShouldOnlyReturnPublished()
    {
        // Arrange
        var draftArticle = CreateArticle("Draft Article", "draft-slug");
        draftArticle.Status = ArticleStatus.Draft;
        _context.Articles.Add(draftArticle);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetBySlugAsync("draft-slug");

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ShouldReturnArticle()
    {
        // Arrange
        var article = CreateArticle("Test Article", "test-slug");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetByIdAsync(article.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(article.Id);
        result.Tags.Should().NotBeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNullWhenNotFound()
    {
        // Act
        var result = await _sut.GetByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnDraftArticles()
    {
        // Arrange
        var draftArticle = CreateArticle("Draft Article", "draft-slug");
        draftArticle.Status = ArticleStatus.Draft;
        _context.Articles.Add(draftArticle);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetByIdAsync(draftArticle.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be(ArticleStatus.Draft);
    }

    #endregion

    #region GetFeaturedArticlesAsync Tests

    [Fact]
    public async Task GetFeaturedArticlesAsync_ShouldReturnOnlyFeatured()
    {
        // Act
        var result = await _sut.GetFeaturedArticlesAsync();

        // Assert
        result.Should().NotBeEmpty();
        result.Should().OnlyContain(a => a.IsFeatured);
        result.Should().OnlyContain(a => a.Status == ArticleStatus.Published);
    }

    [Fact]
    public async Task GetFeaturedArticlesAsync_ShouldOrderByVotes()
    {
        // Act
        var result = await _sut.GetFeaturedArticlesAsync();

        // Assert
        result.Should().BeInDescendingOrder(a => a.VoteCount);
    }

    #endregion

    #region GetTrendingArticlesAsync Tests

    [Fact]
    public async Task GetTrendingArticlesAsync_ShouldReturnOnlyTrending()
    {
        // Act
        var result = await _sut.GetTrendingArticlesAsync();

        // Assert
        result.Should().NotBeEmpty();
        result.Should().OnlyContain(a => a.IsTrending);
        result.Should().OnlyContain(a => a.Status == ArticleStatus.Published);
    }

    [Fact]
    public async Task GetTrendingArticlesAsync_ShouldOrderByVotes()
    {
        // Act
        var result = await _sut.GetTrendingArticlesAsync();

        // Assert
        result.Should().BeInDescendingOrder(a => a.VoteCount);
    }

    #endregion

    #region GetRelatedArticlesAsync Tests

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldReturnSameCategoryArticles()
    {
        // guide-1 (Guide) should get guide-2 (Guide) as related
        var result = await _sut.GetRelatedArticlesAsync("guide-1");

        result.Should().NotBeEmpty();
        result.Should().NotContain(a => a.Slug == "guide-1");
        result.Should().Contain(a => a.Slug == "guide-2");
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldExcludeCurrentArticle()
    {
        var result = await _sut.GetRelatedArticlesAsync("guide-1");

        result.Should().NotContain(a => a.Slug == "guide-1");
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldReturnEmptyForUnknownSlug()
    {
        var result = await _sut.GetRelatedArticlesAsync("nonexistent-slug");

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldRespectLimit()
    {
        var result = await _sut.GetRelatedArticlesAsync("guide-1", limit: 1);

        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldIncludeTagMatchesForCrossCategory()
    {
        // Arrange: add article with unique category but shares "Architecture" tag
        var archTag = _context.Tags.First(t => t.Name == "Architecture");
        var uniqueArticle = CreateArticle("Unique Category Article", "unique-cat-article",
            ArticleCategory.News, tags: new[] { archTag });
        _context.Articles.Add(uniqueArticle);
        await _context.SaveChangesAsync();

        // unique-cat-article has no same-category peers, but shares "Architecture" tag
        var result = await _sut.GetRelatedArticlesAsync("unique-cat-article");

        result.Should().NotBeEmpty();
        result.Should().NotContain(a => a.Slug == "unique-cat-article");
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldNotReturnDraftArticles()
    {
        // Arrange: add a draft in same category as guide-1
        var draftArticle = CreateArticle("Draft Guide Article", "draft-guide", ArticleCategory.Guide);
        draftArticle.Status = ArticleStatus.Draft;
        _context.Articles.Add(draftArticle);
        await _context.SaveChangesAsync();

        var result = await _sut.GetRelatedArticlesAsync("guide-1");

        result.Should().NotContain(a => a.Slug == "draft-guide");
        result.Should().OnlyContain(a => a.Status == ArticleStatus.Published);
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldOrderSameCategoryFirst()
    {
        // guide-1 is Guide; guide-2 is also Guide (same category)
        // tutorial-1 is Tutorial+Performance-tag (no tag overlap with guide-1)
        var result = await _sut.GetRelatedArticlesAsync("guide-1", limit: 5);

        // All same-category articles should appear before cross-category ones
        var sameCategoryArticles = result.Where(a => a.Category == ArticleCategory.Guide).ToList();
        var crossCategoryArticles = result.Where(a => a.Category != ArticleCategory.Guide).ToList();

        if (sameCategoryArticles.Count > 0 && crossCategoryArticles.Count > 0)
        {
            var lastSameCategoryIndex = result.FindLastIndex(a => a.Category == ArticleCategory.Guide);
            var firstCrossCategoryIndex = result.FindIndex(a => a.Category != ArticleCategory.Guide);
            lastSameCategoryIndex.Should().BeLessThan(firstCrossCategoryIndex);
        }
    }

    #endregion

    #region AddAsync Tests

    [Fact]
    public async Task AddAsync_ShouldAddArticle()
    {
        // Arrange
        var article = CreateArticle("New Article", "new-article");

        // Act
        var result = await _sut.AddAsync(article);
        await _context.SaveChangesAsync();

        // Assert
        var saved = await _context.Articles.FindAsync(article.Id);
        saved.Should().NotBeNull();
        saved!.Title.Should().Be("New Article");
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ShouldUpdateArticle()
    {
        // Arrange
        var article = CreateArticle("Original Title", "original-slug");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        article.Title = "Updated Title";

        // Act
        await _sut.UpdateAsync(article);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Articles.FindAsync(article.Id);
        updated.Should().NotBeNull();
        updated!.Title.Should().Be("Updated Title");
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ShouldDeleteArticle()
    {
        // Arrange
        var article = CreateArticle("To Delete", "to-delete");
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.DeleteAsync(article.Id);
        await _context.SaveChangesAsync();

        // Assert
        result.Should().BeTrue();
        var deleted = await _context.Articles.FindAsync(article.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalseWhenNotFound()
    {
        // Act
        var result = await _sut.DeleteAsync(Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region IncrementVoteCountAsync Tests

    // NOTE: ExecuteUpdateAsync is not supported by InMemory provider
    // These tests are covered by integration tests which use a real database
    // See: ArticleEndpointsTests.VoteForArticle_ShouldIncrementVoteCount

    #endregion

    #region Helper Methods

    private void SeedTestData()
    {
        var tag1 = new Tag { Id = Guid.NewGuid(), Name = "Testing" };
        var tag2 = new Tag { Id = Guid.NewGuid(), Name = "Architecture" };
        var tag3 = new Tag { Id = Guid.NewGuid(), Name = "Performance" };

        _context.Tags.AddRange(tag1, tag2, tag3);

        var articles = new List<Article>
        {
            CreateArticle("Guide Article 1", "guide-1", ArticleCategory.Guide, 50, true, false, new[] { tag2 }),
            CreateArticle("Guide Article 2", "guide-2", ArticleCategory.Guide, 30, false, false, new[] { tag2 }),
            CreateArticle("Tutorial with Testing", "tutorial-1", ArticleCategory.Tutorial, 40, false, true, new[] { tag1 }),
            CreateArticle("General Article", "general-1", ArticleCategory.General, 35, false, true, new[] { tag3 }),
            CreateArticle("Reference Article", "reference-1", ArticleCategory.Reference, 25, true, false, new[] { tag3 }),
        };

        _context.Articles.AddRange(articles);
        _context.SaveChanges();
    }

    private Article CreateArticle(
        string title,
        string slug,
        ArticleCategory category = ArticleCategory.Guide,
        int voteCount = 0,
        bool isFeatured = false,
        bool isTrending = false,
        Tag[]? tags = null)
    {
        return new Article
        {
            Id = Guid.NewGuid(),
            Title = title,
            Slug = slug,
            ShortDescription = $"Description for {title}",
            FullContent = $"Full content for {title}",
            Category = category,
            Author = "Test Author",
            CreatedDate = DateTime.UtcNow,
            UpdatedDate = DateTime.UtcNow,
            VoteCount = voteCount,
            Status = ArticleStatus.Published,
            IsFeatured = isFeatured,
            IsTrending = isTrending,
            Tags = tags?.ToList() ?? new List<Tag>()
        };
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}
