using Accelerator.Core.Entities;
using Accelerator.Core.Interfaces;

namespace Accelerator.Core.Services;

public interface IArticleService
{
    Task<PaginatedResult<Article>> GetArticlesAsync(
        int page, int pageSize, string? sortBy, string? category,
        List<string>? tags, string? search,
        DateTime? dateFrom = null, DateTime? dateTo = null,
        string? tagMode = "any", CancellationToken ct = default);

    Task<Article?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<List<Article>> GetFeaturedArticlesAsync(CancellationToken ct = default);
    Task<List<Article>> GetTrendingArticlesAsync(CancellationToken ct = default);
    Task<List<Article>> GetRelatedArticlesAsync(string slug, int limit = 3, CancellationToken ct = default);

    Task<Article> CreateArticleAsync(Article article, List<string> tagNames, CancellationToken ct = default);
    Task<Article?> UpdateArticleAsync(Guid id, Article updated, List<string> tagNames, CancellationToken ct = default);
    Task<bool> DeleteArticleAsync(Guid id, CancellationToken ct = default);
    Task<int> VoteForArticleAsync(Guid id, CancellationToken ct = default);
}
