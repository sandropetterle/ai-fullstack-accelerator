using Accelerator.Api.DTOs;
using Accelerator.Core.Entities;

namespace Accelerator.Api.Mappers;

public static class ArticleMapper
{
    public static ArticleListDto ToListDto(Article a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Slug = a.Slug,
        ShortDescription = a.ShortDescription,
        Category = a.Category.ToString(),
        Tags = a.Tags.Select(t => t.Name).ToList(),
        Author = a.Author,
        CreatedDate = a.CreatedDate.ToString("o"),
        UpdatedDate = a.UpdatedDate.ToString("o"),
        VoteCount = a.VoteCount,
        Status = a.Status.ToString().ToLower(),
        IsFeatured = a.IsFeatured,
        IsTrending = a.IsTrending
    };

    public static ArticleDetailDto ToDetailDto(Article a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Slug = a.Slug,
        ShortDescription = a.ShortDescription,
        FullContent = a.FullContent,
        Category = a.Category.ToString(),
        Tags = a.Tags.Select(t => t.Name).ToList(),
        Author = a.Author,
        CreatedDate = a.CreatedDate.ToString("o"),
        UpdatedDate = a.UpdatedDate.ToString("o"),
        VoteCount = a.VoteCount,
        Status = a.Status.ToString().ToLower(),
        IsFeatured = a.IsFeatured,
        IsTrending = a.IsTrending
    };
}
