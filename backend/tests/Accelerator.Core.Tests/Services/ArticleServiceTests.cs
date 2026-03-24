using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using Accelerator.Core.Interfaces;
using Accelerator.Core.Services;
using Accelerator.Core.ValueObjects;
using FluentAssertions;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace Accelerator.Core.Tests.Services;

public class ArticleServiceTests
{
    private readonly Mock<IArticleRepository> _articleRepositoryMock;
    private readonly Mock<ITagRepository> _tagRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly IMemoryCache _cache;
    private readonly FakeTimeProvider _timeProvider;
    private readonly FakeTelemetryChannel _telemetryChannel;
    private readonly TelemetryClient _telemetryClient;
    private readonly ArticleService _sut;

    public ArticleServiceTests()
    {
        _articleRepositoryMock = new Mock<IArticleRepository>();
        _tagRepositoryMock = new Mock<ITagRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _timeProvider = new FakeTimeProvider(new DateTimeOffset(2024, 1, 15, 10, 0, 0, TimeSpan.Zero));
        _telemetryChannel = new FakeTelemetryChannel();
        var telemetryConfig = new TelemetryConfiguration { TelemetryChannel = _telemetryChannel };
        _telemetryClient = new TelemetryClient(telemetryConfig);

        _sut = new ArticleService(
            _articleRepositoryMock.Object,
            _tagRepositoryMock.Object,
            _unitOfWorkMock.Object,
            _cache,
            _timeProvider,
            _telemetryClient);
    }

    #region GetArticlesAsync Tests

    [Fact]
    public async Task GetArticlesAsync_ShouldDelegateToRepository()
    {
        // Arrange
        var expectedResult = new PaginatedResult<Article>
        {
            Items = new List<Article>(),
            TotalCount = 0,
            CurrentPage = 1,
            PageSize = 10
        };
        _articleRepositoryMock
            .Setup(r => r.GetArticlesAsync(1, 10, null, null, null, null,
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _sut.GetArticlesAsync(1, 10, null, null, null, null);

        // Assert
        result.Should().Be(expectedResult);
        _articleRepositoryMock.Verify(r => r.GetArticlesAsync(1, 10, null, null, null, null,
            It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldPassAllParametersToRepository()
    {
        // Arrange
        var tags = new List<string> { "tag1", "tag2" };
        var expectedResult = new PaginatedResult<Article>
        {
            Items = new List<Article>(),
            TotalCount = 0,
            CurrentPage = 2,
            PageSize = 20
        };
        _articleRepositoryMock
            .Setup(r => r.GetArticlesAsync(2, 20, "votes", "Guide", tags, "search",
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _sut.GetArticlesAsync(2, 20, "votes", "Guide", tags, "search");

        // Assert
        result.Should().Be(expectedResult);
        _articleRepositoryMock.Verify(r => r.GetArticlesAsync(2, 20, "votes", "Guide", tags, "search",
            It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region GetBySlugAsync Tests

    [Fact]
    public async Task GetBySlugAsync_ShouldDelegateToRepository()
    {
        // Arrange
        var slug = "test-article";
        var expectedArticle = CreateTestArticle();
        _articleRepositoryMock
            .Setup(r => r.GetBySlugAsync(slug, default))
            .ReturnsAsync(expectedArticle);

        // Act
        var result = await _sut.GetBySlugAsync(slug);

        // Assert
        result.Should().Be(expectedArticle);
        _articleRepositoryMock.Verify(r => r.GetBySlugAsync(slug, default), Times.Once);
    }

    [Fact]
    public async Task GetBySlugAsync_ShouldReturnNullWhenNotFound()
    {
        // Arrange
        _articleRepositoryMock
            .Setup(r => r.GetBySlugAsync("nonexistent", default))
            .ReturnsAsync((Article?)null);

        // Act
        var result = await _sut.GetBySlugAsync("nonexistent");

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region GetFeaturedArticlesAsync Tests

    [Fact]
    public async Task GetFeaturedArticlesAsync_ShouldCacheResult()
    {
        // Arrange
        var articles = new List<Article> { CreateTestArticle() };
        _articleRepositoryMock
            .Setup(r => r.GetFeaturedArticlesAsync(default))
            .ReturnsAsync(articles);

        // Act
        var result1 = await _sut.GetFeaturedArticlesAsync();
        var result2 = await _sut.GetFeaturedArticlesAsync();

        // Assert
        result1.Should().BeEquivalentTo(articles);
        result2.Should().BeEquivalentTo(articles);
        _articleRepositoryMock.Verify(r => r.GetFeaturedArticlesAsync(default), Times.Once);
    }

    [Fact]
    public async Task GetFeaturedArticlesAsync_ShouldReturnEmptyListWhenCacheReturnsNull()
    {
        // Arrange
        _articleRepositoryMock
            .Setup(r => r.GetFeaturedArticlesAsync(default))
            .ReturnsAsync((List<Article>)null!);

        // Act
        var result = await _sut.GetFeaturedArticlesAsync();

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region GetTrendingArticlesAsync Tests

    [Fact]
    public async Task GetTrendingArticlesAsync_ShouldCacheResult()
    {
        // Arrange
        var articles = new List<Article> { CreateTestArticle() };
        _articleRepositoryMock
            .Setup(r => r.GetTrendingArticlesAsync(default))
            .ReturnsAsync(articles);

        // Act
        var result1 = await _sut.GetTrendingArticlesAsync();
        var result2 = await _sut.GetTrendingArticlesAsync();

        // Assert
        result1.Should().BeEquivalentTo(articles);
        result2.Should().BeEquivalentTo(articles);
        _articleRepositoryMock.Verify(r => r.GetTrendingArticlesAsync(default), Times.Once);
    }

    [Fact]
    public async Task GetTrendingArticlesAsync_ShouldReturnEmptyListWhenCacheReturnsNull()
    {
        // Arrange
        _articleRepositoryMock
            .Setup(r => r.GetTrendingArticlesAsync(default))
            .ReturnsAsync((List<Article>)null!);

        // Act
        var result = await _sut.GetTrendingArticlesAsync();

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region GetRelatedArticlesAsync Tests

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldCacheResult()
    {
        // Arrange
        var slug = "test-article";
        var articles = new List<Article> { CreateTestArticle() };
        _articleRepositoryMock
            .Setup(r => r.GetRelatedArticlesAsync(slug, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(articles);

        // Act
        var result1 = await _sut.GetRelatedArticlesAsync(slug);
        var result2 = await _sut.GetRelatedArticlesAsync(slug);

        // Assert
        result1.Should().BeEquivalentTo(articles);
        result2.Should().BeEquivalentTo(articles);
        _articleRepositoryMock.Verify(r => r.GetRelatedArticlesAsync(slug, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldUseDifferentCacheKeysPerSlug()
    {
        // Arrange
        var slug1 = "article-one";
        var slug2 = "article-two";
        var articles1 = new List<Article> { CreateTestArticle(Guid.NewGuid()) };
        var articles2 = new List<Article> { CreateTestArticle(Guid.NewGuid()) };

        _articleRepositoryMock
            .Setup(r => r.GetRelatedArticlesAsync(slug1, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(articles1);
        _articleRepositoryMock
            .Setup(r => r.GetRelatedArticlesAsync(slug2, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(articles2);

        // Act
        var result1 = await _sut.GetRelatedArticlesAsync(slug1);
        var result2 = await _sut.GetRelatedArticlesAsync(slug2);

        // Assert
        result1.Should().BeEquivalentTo(articles1);
        result2.Should().BeEquivalentTo(articles2);
        _articleRepositoryMock.Verify(r => r.GetRelatedArticlesAsync(slug1, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        _articleRepositoryMock.Verify(r => r.GetRelatedArticlesAsync(slug2, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetRelatedArticlesAsync_ShouldReturnEmptyListWhenCacheReturnsNull()
    {
        // Arrange
        var slug = "test-article";
        _articleRepositoryMock
            .Setup(r => r.GetRelatedArticlesAsync(slug, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((List<Article>)null!);

        // Act
        var result = await _sut.GetRelatedArticlesAsync(slug);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region CreateArticleAsync Tests

    [Fact]
    public async Task CreateArticleAsync_ShouldSetAllRequiredFields()
    {
        // Arrange
        var article = new Article
        {
            Title = "Test Article",
            ShortDescription = "Test Description",
            Category = ArticleCategory.Guide,
            Author = "Test Author"
        };
        var tagNames = new List<string> { "tag1", "tag2" };
        var existingTags = new List<Tag>
        {
            new() { Id = Guid.NewGuid(), Name = "tag1" },
            new() { Id = Guid.NewGuid(), Name = "tag2" }
        };

        _tagRepositoryMock
            .Setup(r => r.GetByNamesAsync(tagNames, default))
            .ReturnsAsync(existingTags);
        _articleRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Article>(), default))
            .ReturnsAsync((Article a, CancellationToken _) => a);

        // Act
        var result = await _sut.CreateArticleAsync(article, tagNames);

        // Assert
        result.Id.Should().NotBe(Guid.Empty);
        result.Slug.Should().Be("test-article");
        result.CreatedDate.Should().Be(new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc));
        result.UpdatedDate.Should().Be(new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc));
        result.Status.Should().Be(ArticleStatus.Published);
        result.VoteCount.Should().Be(0);
        result.Tags.Should().HaveCount(2);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CreateArticleAsync_ShouldCreateNewTagsWhenNotExist()
    {
        // Arrange
        var article = new Article
        {
            Title = "Test Article",
            ShortDescription = "Test Description",
            Category = ArticleCategory.Guide
        };
        var tagNames = new List<string> { "existing", "new" };
        var existingTag = new Tag { Id = Guid.NewGuid(), Name = "existing" };
        var newTag = new Tag { Id = Guid.NewGuid(), Name = "new" };

        _tagRepositoryMock
            .Setup(r => r.GetByNamesAsync(tagNames, default))
            .ReturnsAsync(new List<Tag> { existingTag });
        _tagRepositoryMock
            .Setup(r => r.AddAsync(It.Is<Tag>(t => t.Name == "new"), default))
            .ReturnsAsync(newTag);
        _articleRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Article>(), default))
            .ReturnsAsync((Article a, CancellationToken _) => a);

        // Act
        var result = await _sut.CreateArticleAsync(article, tagNames);

        // Assert
        result.Tags.Should().HaveCount(2);
        result.Tags.Should().Contain(t => t.Name == "existing");
        result.Tags.Should().Contain(t => t.Name == "new");
        _tagRepositoryMock.Verify(r => r.AddAsync(It.Is<Tag>(t => t.Name == "new"), default), Times.Once);
    }

    [Fact]
    public async Task CreateArticleAsync_ShouldHandleEmptyTagList()
    {
        // Arrange
        var article = new Article
        {
            Title = "Test Article",
            ShortDescription = "Test Description",
            Category = ArticleCategory.Guide
        };
        var tagNames = new List<string>();

        _articleRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Article>(), default))
            .ReturnsAsync((Article a, CancellationToken _) => a);

        // Act
        var result = await _sut.CreateArticleAsync(article, tagNames);

        // Assert
        result.Tags.Should().BeEmpty();
        _tagRepositoryMock.Verify(r => r.GetByNamesAsync(It.IsAny<List<string>>(), default), Times.Never);
    }

    #endregion

    #region UpdateArticleAsync Tests

    [Fact]
    public async Task UpdateArticleAsync_ShouldUpdateAllFields()
    {
        // Arrange
        var id = Guid.NewGuid();
        var existing = CreateTestArticle(id);
        var updated = new Article
        {
            Title = "Updated Title",
            ShortDescription = "Updated Description",
            FullContent = "Updated Content",
            Category = ArticleCategory.Reference,
            Author = "Updated Author",
            IsFeatured = true,
            IsTrending = true
        };
        var tagNames = new List<string> { "tag1" };
        var tags = new List<Tag> { new() { Id = Guid.NewGuid(), Name = "tag1" } };

        _articleRepositoryMock
            .Setup(r => r.GetByIdAsync(id, default))
            .ReturnsAsync(existing);
        _tagRepositoryMock
            .Setup(r => r.GetByNamesAsync(tagNames, default))
            .ReturnsAsync(tags);

        // Act
        var result = await _sut.UpdateArticleAsync(id, updated, tagNames);

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated Title");
        result.Slug.Should().Be("updated-title");
        result.ShortDescription.Should().Be("Updated Description");
        result.FullContent.Should().Be("Updated Content");
        result.Category.Should().Be(ArticleCategory.Reference);
        result.Author.Should().Be("Updated Author");
        result.IsFeatured.Should().BeTrue();
        result.IsTrending.Should().BeTrue();
        result.UpdatedDate.Should().Be(new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc));
        result.Tags.Should().HaveCount(1);
        _articleRepositoryMock.Verify(r => r.UpdateAsync(existing, default), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateArticleAsync_ShouldReturnNullWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _articleRepositoryMock
            .Setup(r => r.GetByIdAsync(id, default))
            .ReturnsAsync((Article?)null);

        // Act
        var result = await _sut.UpdateArticleAsync(id, new Article(), new List<string>());

        // Assert
        result.Should().BeNull();
        _articleRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<Article>(), default), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Never);
    }

    #endregion

    #region DeleteArticleAsync Tests

    [Fact]
    public async Task DeleteArticleAsync_ShouldDeleteAndSave()
    {
        // Arrange
        var id = Guid.NewGuid();
        _articleRepositoryMock
            .Setup(r => r.DeleteAsync(id, default))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.DeleteArticleAsync(id);

        // Assert
        result.Should().BeTrue();
        _articleRepositoryMock.Verify(r => r.DeleteAsync(id, default), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteArticleAsync_ShouldNotSaveWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _articleRepositoryMock
            .Setup(r => r.DeleteAsync(id, default))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.DeleteArticleAsync(id);

        // Assert
        result.Should().BeFalse();
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Never);
    }

    #endregion

    #region VoteForArticleAsync Tests

    [Fact]
    public async Task VoteForArticleAsync_ShouldIncrementVoteAndInvalidateCache()
    {
        // Arrange
        var id = Guid.NewGuid();
        _articleRepositoryMock
            .Setup(r => r.IncrementVoteCountAsync(id, default))
            .ReturnsAsync(42);

        // Seed cache
        var articles = new List<Article> { CreateTestArticle() };
        _articleRepositoryMock
            .Setup(r => r.GetFeaturedArticlesAsync(default))
            .ReturnsAsync(articles);
        _articleRepositoryMock
            .Setup(r => r.GetTrendingArticlesAsync(default))
            .ReturnsAsync(articles);
        await _sut.GetFeaturedArticlesAsync();
        await _sut.GetTrendingArticlesAsync();

        // Act
        var result = await _sut.VoteForArticleAsync(id);

        // Assert
        result.Should().Be(42);
        _articleRepositoryMock.Verify(r => r.IncrementVoteCountAsync(id, default), Times.Once);

        // Verify cache was invalidated by checking repository is called again
        _articleRepositoryMock.Invocations.Clear();
        _articleRepositoryMock
            .Setup(r => r.GetFeaturedArticlesAsync(default))
            .ReturnsAsync(articles);
        await _sut.GetFeaturedArticlesAsync();
        _articleRepositoryMock.Verify(r => r.GetFeaturedArticlesAsync(default), Times.Once);
    }

    #endregion

    #region Business Telemetry Tests

    [Fact]
    public async Task GetBySlugAsync_ShouldTrackArticleViewedEvent_WhenArticleFound()
    {
        // Arrange
        var slug = "test-article";
        var article = CreateTestArticle();
        _articleRepositoryMock
            .Setup(r => r.GetBySlugAsync(slug, default))
            .ReturnsAsync(article);

        // Act
        await _sut.GetBySlugAsync(slug);

        // Assert
        _telemetryClient.Flush();
        var evt = _telemetryChannel.Items
            .OfType<Microsoft.ApplicationInsights.DataContracts.EventTelemetry>()
            .Single();
        evt.Name.Should().Be("ArticleViewed");
        evt.Properties["slug"].Should().Be(slug);
    }

    [Fact]
    public async Task GetBySlugAsync_ShouldNotTrackEvent_WhenArticleNotFound()
    {
        // Arrange
        _articleRepositoryMock
            .Setup(r => r.GetBySlugAsync("nonexistent", default))
            .ReturnsAsync((Article?)null);

        // Act
        await _sut.GetBySlugAsync("nonexistent");

        // Assert
        _telemetryClient.Flush();
        _telemetryChannel.Items.OfType<Microsoft.ApplicationInsights.DataContracts.EventTelemetry>()
            .Should().BeEmpty();
    }

    [Fact]
    public async Task CreateArticleAsync_ShouldTrackArticleCreatedEvent()
    {
        // Arrange
        var article = new Article
        {
            Title = "Test Article",
            ShortDescription = "Test Description",
            Category = ArticleCategory.Guide
        };
        _tagRepositoryMock
            .Setup(r => r.GetByNamesAsync(It.IsAny<List<string>>(), default))
            .ReturnsAsync(new List<Tag>());
        _articleRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Article>(), default))
            .ReturnsAsync((Article a, CancellationToken _) => a);

        // Act
        await _sut.CreateArticleAsync(article, new List<string>());

        // Assert
        _telemetryClient.Flush();
        var evt = _telemetryChannel.Items
            .OfType<Microsoft.ApplicationInsights.DataContracts.EventTelemetry>()
            .Single();
        evt.Name.Should().Be("ArticleCreated");
    }

    [Fact]
    public async Task VoteForArticleAsync_ShouldTrackArticleVotedEvent()
    {
        // Arrange
        var id = Guid.NewGuid();
        _articleRepositoryMock
            .Setup(r => r.IncrementVoteCountAsync(id, default))
            .ReturnsAsync(1);

        // Act
        await _sut.VoteForArticleAsync(id);

        // Assert
        _telemetryClient.Flush();
        var evt = _telemetryChannel.Items
            .OfType<Microsoft.ApplicationInsights.DataContracts.EventTelemetry>()
            .Single();
        evt.Name.Should().Be("ArticleVoted");
        evt.Properties["articleId"].Should().Be(id.ToString());
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldTrackArticleSearchedEvent_WhenFilterApplied()
    {
        // Arrange
        var expectedResult = new PaginatedResult<Article> { Items = new List<Article>(), TotalCount = 0, CurrentPage = 1, PageSize = 10 };
        _articleRepositoryMock
            .Setup(r => r.GetArticlesAsync(1, 10, null, null, null, "test",
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        await _sut.GetArticlesAsync(1, 10, null, null, null, "test");

        // Assert
        _telemetryClient.Flush();
        var evt = _telemetryChannel.Items
            .OfType<Microsoft.ApplicationInsights.DataContracts.EventTelemetry>()
            .Single();
        evt.Name.Should().Be("ArticleSearched");
        evt.Properties["search"].Should().Be("test");
    }

    [Fact]
    public async Task UpdateArticleAsync_ShouldTrackArticleUpdatedEvent()
    {
        // Arrange
        var id = Guid.NewGuid();
        var existing = CreateTestArticle(id);
        var updated = new Article { Title = "Updated Title", Category = ArticleCategory.Reference };
        var tags = new List<Tag>();

        _articleRepositoryMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync(existing);
        _tagRepositoryMock.Setup(r => r.GetByNamesAsync(It.IsAny<List<string>>(), default)).ReturnsAsync(tags);

        // Act
        await _sut.UpdateArticleAsync(id, updated, new List<string>());

        // Assert
        _telemetryClient.Flush();
        var evt = _telemetryChannel.Items
            .OfType<Microsoft.ApplicationInsights.DataContracts.EventTelemetry>()
            .Single();
        evt.Name.Should().Be("ArticleUpdated");
    }

    [Fact]
    public async Task GetFeaturedArticlesAsync_ShouldTrackCacheHitMetric()
    {
        // Arrange
        var articles = new List<Article> { CreateTestArticle() };
        _articleRepositoryMock.Setup(r => r.GetFeaturedArticlesAsync(default)).ReturnsAsync(articles);

        // Act — first call (cache miss), second call (cache hit)
        await _sut.GetFeaturedArticlesAsync();
        _telemetryChannel.Items.Clear();
        await _sut.GetFeaturedArticlesAsync();

        // Assert — second call should record metric value 1 (hit)
        _telemetryClient.Flush();
        var metric = _telemetryChannel.Items
            .OfType<Microsoft.ApplicationInsights.DataContracts.MetricTelemetry>()
            .Single();
        metric.Name.Should().Be("FeaturedArticlesCacheHit");
        metric.Sum.Should().Be(1);
    }

    [Fact]
    public async Task GetTrendingArticlesAsync_ShouldTrackCacheMissMetric()
    {
        // Arrange
        var articles = new List<Article> { CreateTestArticle() };
        _articleRepositoryMock.Setup(r => r.GetTrendingArticlesAsync(default)).ReturnsAsync(articles);

        // Act — first call (cache miss)
        await _sut.GetTrendingArticlesAsync();

        // Assert — first call should record metric value 0 (miss)
        _telemetryClient.Flush();
        var metric = _telemetryChannel.Items
            .OfType<Microsoft.ApplicationInsights.DataContracts.MetricTelemetry>()
            .Single();
        metric.Name.Should().Be("TrendingArticlesCacheHit");
        metric.Sum.Should().Be(0);
    }

    [Fact]
    public async Task GetArticlesAsync_ShouldNotTrackEvent_WhenNoFilterApplied()
    {
        // Arrange
        var expectedResult = new PaginatedResult<Article> { Items = new List<Article>(), TotalCount = 0, CurrentPage = 1, PageSize = 10 };
        _articleRepositoryMock
            .Setup(r => r.GetArticlesAsync(1, 10, null, null, null, null,
                It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        await _sut.GetArticlesAsync(1, 10, null, null, null, null);

        // Assert
        _telemetryClient.Flush();
        _telemetryChannel.Items.Should().BeEmpty();
    }

    #endregion

    #region Helper Methods

    private Article CreateTestArticle(Guid? id = null)
    {
        return new Article
        {
            Id = id ?? Guid.NewGuid(),
            Title = "Test Article",
            Slug = "test-article",
            ShortDescription = "Test Description",
            FullContent = "Test Content",
            Category = ArticleCategory.Guide,
            Tags = new List<Tag>(),
            Author = "Test Author",
            CreatedDate = DateTime.UtcNow,
            UpdatedDate = DateTime.UtcNow,
            VoteCount = 0,
            Status = ArticleStatus.Published,
            IsFeatured = false,
            IsTrending = false
        };
    }

    #endregion
}

/// <summary>
/// Fake Application Insights channel that captures telemetry items in memory for assertions
/// </summary>
public class FakeTelemetryChannel : ITelemetryChannel
{
    public List<ITelemetry> Items { get; } = new();
    public bool? DeveloperMode { get; set; }
    public string? EndpointAddress { get; set; }

    public void Send(ITelemetry item) => Items.Add(item);
    public void Flush() { }
    public void Dispose() { }
}

/// <summary>
/// Fake TimeProvider for testing time-dependent logic
/// </summary>
public class FakeTimeProvider : TimeProvider
{
    private readonly DateTimeOffset _fixedTime;

    public FakeTimeProvider(DateTimeOffset fixedTime)
    {
        _fixedTime = fixedTime;
    }

    public override DateTimeOffset GetUtcNow() => _fixedTime;
}
