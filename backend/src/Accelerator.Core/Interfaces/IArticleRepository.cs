using Accelerator.Core.Entities;

namespace Accelerator.Core.Interfaces;

public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public interface IArticleRepository
{
    Task<PaginatedResult<Article>> GetArticlesAsync(
        int page, int pageSize, string? sortBy, string? category,
        List<string>? tags, string? search,
        DateTime? dateFrom = null, DateTime? dateTo = null,
        string? tagMode = "any", CancellationToken ct = default);

    Task<Article?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<Article?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Article>> GetFeaturedArticlesAsync(CancellationToken ct = default);
    Task<List<Article>> GetTrendingArticlesAsync(CancellationToken ct = default);
    Task<List<Article>> GetRelatedArticlesAsync(string slug, int limit = 3, CancellationToken ct = default);

    Task<Article> AddAsync(Article article, CancellationToken ct = default);
    Task UpdateAsync(Article article, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<int> IncrementVoteCountAsync(Guid id, CancellationToken ct = default);
}
