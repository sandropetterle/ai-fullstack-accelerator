using Accelerator.Api.Mappers;
using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using FluentAssertions;

namespace Accelerator.Api.Tests.Mappers;

public class ArticleMapperTests
{
    #region ToListDto Tests

    [Fact]
    public void ToListDto_ShouldMapAllProperties()
    {
        // Arrange
        var article = CreateTestArticle();

        // Act
        var result = ArticleMapper.ToListDto(article);

        // Assert
        result.Id.Should().Be(article.Id);
        result.Title.Should().Be(article.Title);
        result.Slug.Should().Be(article.Slug);
        result.ShortDescription.Should().Be(article.ShortDescription);
        result.Author.Should().Be(article.Author);
        result.VoteCount.Should().Be(article.VoteCount);
        result.IsFeatured.Should().Be(article.IsFeatured);
        result.IsTrending.Should().Be(article.IsTrending);
    }

    [Theory]
    [InlineData(ArticleCategory.General, "General")]
    [InlineData(ArticleCategory.Tutorial, "Tutorial")]
    [InlineData(ArticleCategory.Guide, "Guide")]
    [InlineData(ArticleCategory.Reference, "Reference")]
    [InlineData(ArticleCategory.News, "News")]
    public void ToListDto_ShouldMapCategoryCorrectly(ArticleCategory category, string expectedString)
    {
        // Arrange
        var article = CreateTestArticle();
        article.Category = category;

        // Act
        var result = ArticleMapper.ToListDto(article);

        // Assert
        result.Category.Should().Be(expectedString);
    }

    [Fact]
    public void ToListDto_ShouldMapTagsToNames()
    {
        // Arrange
        var article = CreateTestArticle();
        article.Tags = new List<Tag>
        {
            new() { Id = Guid.NewGuid(), Name = "Tag1" },
            new() { Id = Guid.NewGuid(), Name = "Tag2" },
            new() { Id = Guid.NewGuid(), Name = "Tag3" }
        };

        // Act
        var result = ArticleMapper.ToListDto(article);

        // Assert
        result.Tags.Should().HaveCount(3);
        result.Tags.Should().Contain("Tag1");
        result.Tags.Should().Contain("Tag2");
        result.Tags.Should().Contain("Tag3");
    }

    [Fact]
    public void ToListDto_ShouldFormatDatesAsISO8601()
    {
        // Arrange
        var createdDate = new DateTime(2024, 1, 15, 10, 30, 45, DateTimeKind.Utc);
        var updatedDate = new DateTime(2024, 1, 20, 14, 15, 30, DateTimeKind.Utc);
        var article = CreateTestArticle();
        article.CreatedDate = createdDate;
        article.UpdatedDate = updatedDate;

        // Act
        var result = ArticleMapper.ToListDto(article);

        // Assert
        result.CreatedDate.Should().Be("2024-01-15T10:30:45.0000000Z");
        result.UpdatedDate.Should().Be("2024-01-20T14:15:30.0000000Z");
    }

    [Theory]
    [InlineData(ArticleStatus.Draft, "draft")]
    [InlineData(ArticleStatus.Published, "published")]
    [InlineData(ArticleStatus.Archived, "archived")]
    public void ToListDto_ShouldMapStatusAsLowercase(ArticleStatus status, string expectedString)
    {
        // Arrange
        var article = CreateTestArticle();
        article.Status = status;

        // Act
        var result = ArticleMapper.ToListDto(article);

        // Assert
        result.Status.Should().Be(expectedString);
    }

    [Fact]
    public void ToListDto_ShouldHandleEmptyTags()
    {
        // Arrange
        var article = CreateTestArticle();
        article.Tags = new List<Tag>();

        // Act
        var result = ArticleMapper.ToListDto(article);

        // Assert
        result.Tags.Should().BeEmpty();
    }

    [Fact]
    public void ToListDto_ShouldHandleNullAuthor()
    {
        // Arrange
        var article = CreateTestArticle();
        article.Author = null;

        // Act
        var result = ArticleMapper.ToListDto(article);

        // Assert
        result.Author.Should().BeNull();
    }

    #endregion

    #region ToDetailDto Tests

    [Fact]
    public void ToDetailDto_ShouldMapAllPropertiesIncludingFullContent()
    {
        // Arrange
        var article = CreateTestArticle();

        // Act
        var result = ArticleMapper.ToDetailDto(article);

        // Assert
        result.Id.Should().Be(article.Id);
        result.Title.Should().Be(article.Title);
        result.Slug.Should().Be(article.Slug);
        result.ShortDescription.Should().Be(article.ShortDescription);
        result.FullContent.Should().Be(article.FullContent);
        result.Author.Should().Be(article.Author);
        result.VoteCount.Should().Be(article.VoteCount);
        result.IsFeatured.Should().Be(article.IsFeatured);
        result.IsTrending.Should().Be(article.IsTrending);
    }

    [Theory]
    [InlineData(ArticleCategory.General, "General")]
    [InlineData(ArticleCategory.Tutorial, "Tutorial")]
    [InlineData(ArticleCategory.Guide, "Guide")]
    public void ToDetailDto_ShouldMapCategoryCorrectly(ArticleCategory category, string expectedString)
    {
        // Arrange
        var article = CreateTestArticle();
        article.Category = category;

        // Act
        var result = ArticleMapper.ToDetailDto(article);

        // Assert
        result.Category.Should().Be(expectedString);
    }

    [Fact]
    public void ToDetailDto_ShouldMapTagsToNames()
    {
        // Arrange
        var article = CreateTestArticle();
        article.Tags = new List<Tag>
        {
            new() { Id = Guid.NewGuid(), Name = "Testing" },
            new() { Id = Guid.NewGuid(), Name = "Architecture" }
        };

        // Act
        var result = ArticleMapper.ToDetailDto(article);

        // Assert
        result.Tags.Should().HaveCount(2);
        result.Tags.Should().Contain("Testing");
        result.Tags.Should().Contain("Architecture");
    }

    [Fact]
    public void ToDetailDto_ShouldFormatDatesAsISO8601()
    {
        // Arrange
        var createdDate = new DateTime(2024, 1, 15, 10, 30, 45, DateTimeKind.Utc);
        var article = CreateTestArticle();
        article.CreatedDate = createdDate;
        article.UpdatedDate = createdDate;

        // Act
        var result = ArticleMapper.ToDetailDto(article);

        // Assert
        result.CreatedDate.Should().Be("2024-01-15T10:30:45.0000000Z");
        result.UpdatedDate.Should().Be("2024-01-15T10:30:45.0000000Z");
    }

    [Theory]
    [InlineData(ArticleStatus.Draft, "draft")]
    [InlineData(ArticleStatus.Published, "published")]
    public void ToDetailDto_ShouldMapStatusAsLowercase(ArticleStatus status, string expectedString)
    {
        // Arrange
        var article = CreateTestArticle();
        article.Status = status;

        // Act
        var result = ArticleMapper.ToDetailDto(article);

        // Assert
        result.Status.Should().Be(expectedString);
    }

    #endregion

    #region Helper Methods

    private Article CreateTestArticle()
    {
        return new Article
        {
            Id = Guid.NewGuid(),
            Title = "Test Article",
            Slug = "test-article",
            ShortDescription = "Test short description",
            FullContent = "Test full content with detailed information",
            Category = ArticleCategory.Guide,
            Tags = new List<Tag>(),
            Author = "Test Author",
            CreatedDate = new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc),
            UpdatedDate = new DateTime(2024, 1, 20, 14, 30, 0, DateTimeKind.Utc),
            VoteCount = 42,
            Status = ArticleStatus.Published,
            IsFeatured = true,
            IsTrending = false
        };
    }

    #endregion
}
