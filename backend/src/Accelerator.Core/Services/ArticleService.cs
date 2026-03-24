using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using Accelerator.Core.Interfaces;
using Accelerator.Core.ValueObjects;
using Microsoft.ApplicationInsights;
using Microsoft.Extensions.Caching.Memory;

namespace Accelerator.Core.Services;

public class ArticleService : IArticleService
{
    private readonly IArticleRepository _articleRepository;
    private readonly ITagRepository _tagRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;
    private readonly TimeProvider _timeProvider;
    private readonly TelemetryClient _telemetry;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public ArticleService(
        IArticleRepository articleRepository,
        ITagRepository tagRepository,
        IUnitOfWork unitOfWork,
        IMemoryCache cache,
        TimeProvider timeProvider,
        TelemetryClient telemetry)
    {
        _articleRepository = articleRepository;
        _tagRepository = tagRepository;
        _unitOfWork = unitOfWork;
        _cache = cache;
        _timeProvider = timeProvider;
        _telemetry = telemetry;
    }

    public Task<PaginatedResult<Article>> GetArticlesAsync(
        int page, int pageSize, string? sortBy, string? category,
        List<string>? tags, string? search,
        DateTime? dateFrom = null, DateTime? dateTo = null,
        string? tagMode = "any", CancellationToken ct = default)
    {
        if (search != null || category != null || (tags != null && tags.Count > 0))
        {
            _telemetry.TrackEvent("ArticleSearched", new Dictionary<string, string>
            {
                ["search"] = search ?? string.Empty,
                ["category"] = category ?? string.Empty,
                ["tagCount"] = (tags?.Count ?? 0).ToString(),
            });
        }
        return _articleRepository.GetArticlesAsync(page, pageSize, sortBy, category, tags, search, dateFrom, dateTo, tagMode, ct);
    }

    public async Task<Article?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var article = await _articleRepository.GetBySlugAsync(slug, ct);
        if (article != null)
        {
            _telemetry.TrackEvent("ArticleViewed", new Dictionary<string, string>
            {
                ["slug"] = slug,
                ["category"] = article.Category.ToString(),
            });
        }
        return article;
    }

    public async Task<List<Article>> GetFeaturedArticlesAsync(CancellationToken ct = default)
    {
        bool cacheHit = _cache.TryGetValue("featured_articles", out _);
        var result = await _cache.GetOrCreateAsync("featured_articles", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return await _articleRepository.GetFeaturedArticlesAsync(ct);
        }) ?? [];
        _telemetry.TrackMetric("FeaturedArticlesCacheHit", cacheHit ? 1 : 0);
        return result;
    }

    public async Task<List<Article>> GetTrendingArticlesAsync(CancellationToken ct = default)
    {
        bool cacheHit = _cache.TryGetValue("trending_articles", out _);
        var result = await _cache.GetOrCreateAsync("trending_articles", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return await _articleRepository.GetTrendingArticlesAsync(ct);
        }) ?? [];
        _telemetry.TrackMetric("TrendingArticlesCacheHit", cacheHit ? 1 : 0);
        return result;
    }

    public async Task<List<Article>> GetRelatedArticlesAsync(string slug, int limit = 3, CancellationToken ct = default)
    {
        var cacheKey = $"related_articles_{slug}";
        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return await _articleRepository.GetRelatedArticlesAsync(slug, limit, ct);
        }) ?? [];
    }

    public async Task<Article> CreateArticleAsync(Article article, List<string> tagNames, CancellationToken ct = default)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        article.Id = Guid.NewGuid();
        article.Slug = Slug.FromTitle(article.Title);
        article.CreatedDate = now;
        article.UpdatedDate = now;
        article.Status = ArticleStatus.Published;
        article.VoteCount = 0;

        article.Tags = await ResolveTagsAsync(tagNames, ct);

        var created = await _articleRepository.AddAsync(article, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _telemetry.TrackEvent("ArticleCreated", new Dictionary<string, string>
        {
            ["slug"] = created.Slug,
            ["category"] = created.Category.ToString(),
        });
        return created;
    }

    public async Task<Article?> UpdateArticleAsync(Guid id, Article updated, List<string> tagNames, CancellationToken ct = default)
    {
        var existing = await _articleRepository.GetByIdAsync(id, ct);
        if (existing == null) return null;

        existing.Title = updated.Title;
        existing.Slug = Slug.FromTitle(updated.Title);
        existing.ShortDescription = updated.ShortDescription;
        existing.FullContent = updated.FullContent;
        existing.Category = updated.Category;
        existing.Author = updated.Author;
        existing.IsFeatured = updated.IsFeatured;
        existing.IsTrending = updated.IsTrending;
        existing.UpdatedDate = _timeProvider.GetUtcNow().UtcDateTime;

        existing.Tags = await ResolveTagsAsync(tagNames, ct);

        await _articleRepository.UpdateAsync(existing, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        _telemetry.TrackEvent("ArticleUpdated", new Dictionary<string, string>
        {
            ["slug"] = existing.Slug,
            ["category"] = existing.Category.ToString(),
        });
        return existing;
    }

    public async Task<bool> DeleteArticleAsync(Guid id, CancellationToken ct = default)
    {
        var result = await _articleRepository.DeleteAsync(id, ct);
        if (result)
            await _unitOfWork.SaveChangesAsync(ct);
        return result;
    }

    public async Task<int> VoteForArticleAsync(Guid id, CancellationToken ct = default)
    {
        var result = await _articleRepository.IncrementVoteCountAsync(id, ct);
        _cache.Remove("featured_articles");
        _cache.Remove("trending_articles");
        _telemetry.TrackEvent("ArticleVoted", new Dictionary<string, string>
        {
            ["articleId"] = id.ToString(),
        });
        return result;
    }

    private async Task<List<Tag>> ResolveTagsAsync(List<string> tagNames, CancellationToken ct)
    {
        if (tagNames.Count == 0) return new List<Tag>();

        var existingTags = await _tagRepository.GetByNamesAsync(tagNames, ct);
        var existingNames = existingTags.Select(t => t.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var name in tagNames.Where(n => !existingNames.Contains(n)))
        {
            var newTag = await _tagRepository.AddAsync(new Tag { Id = Guid.NewGuid(), Name = name }, ct);
            existingTags.Add(newTag);
        }

        return existingTags;
    }
}
