using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using Accelerator.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Accelerator.Data.Repositories;

public class ArticleRepository : IArticleRepository
{
    private readonly ApplicationDbContext _context;

    public ArticleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<Article>> GetArticlesAsync(
        int page, int pageSize, string? sortBy, string? category,
        List<string>? tags, string? search,
        DateTime? dateFrom = null, DateTime? dateTo = null,
        string? tagMode = "any", CancellationToken ct = default)
    {
        var query = _context.Articles
            .Include(a => a.Tags)
            .Where(a => a.Status == ArticleStatus.Published)
            .AsNoTracking();

        // Filter by category
        if (!string.IsNullOrWhiteSpace(category) &&
            Enum.TryParse<ArticleCategory>(category, true, out var parsedCategory))
        {
            query = query.Where(a => a.Category == parsedCategory);
        }

        // Filter by tags (AND or OR mode)
        if (tags is { Count: > 0 })
        {
            if (tagMode == "all")
            {
                query = tags.Aggregate(query, (current, tag) =>
                    current.Where(a => a.Tags.Any(t => t.Name == tag)));
            }
            else
            {
                query = query.Where(a => a.Tags.Any(t => tags.Contains(t.Name)));
            }
        }

        // Search (title, short description, full content, and tags)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(searchLower) ||
                a.ShortDescription.ToLower().Contains(searchLower) ||
                (a.FullContent ?? string.Empty).ToLower().Contains(searchLower) ||
                a.Tags.Any(t => t.Name.ToLower().Contains(searchLower)));
        }

        // Date range filter
        if (dateFrom.HasValue)
            query = query.Where(a => a.CreatedDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(a => a.CreatedDate <= dateTo.Value.AddDays(1)); // inclusive end

        // Get total count before pagination
        var totalCount = await query.CountAsync(ct);

        // Sort
        query = sortBy?.ToLower() switch
        {
            "votes" => query.OrderByDescending(a => a.VoteCount),
            "alphabetical" => query.OrderBy(a => a.Title),
            _ => query.OrderByDescending(a => a.CreatedDate)
        };

        // Paginate with projection (exclude FullContent for list views)
        var articles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new Article
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                ShortDescription = a.ShortDescription,
                Category = a.Category,
                Tags = a.Tags,
                Author = a.Author,
                CreatedDate = a.CreatedDate,
                UpdatedDate = a.UpdatedDate,
                VoteCount = a.VoteCount,
                Status = a.Status,
                IsFeatured = a.IsFeatured,
                IsTrending = a.IsTrending
            })
            .ToListAsync(ct);

        return new PaginatedResult<Article>
        {
            Items = articles,
            TotalCount = totalCount,
            CurrentPage = page,
            PageSize = pageSize
        };
    }

    public async Task<Article?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        return await _context.Articles
            .Include(a => a.Tags)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Slug == slug && a.Status == ArticleStatus.Published, ct);
    }

    public async Task<Article?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Articles
            .Include(a => a.Tags)
            .FirstOrDefaultAsync(a => a.Id == id, ct);
    }

    public async Task<List<Article>> GetFeaturedArticlesAsync(CancellationToken ct = default)
    {
        return await _context.Articles
            .Include(a => a.Tags)
            .Where(a => a.IsFeatured && a.Status == ArticleStatus.Published)
            .OrderByDescending(a => a.VoteCount)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<List<Article>> GetTrendingArticlesAsync(CancellationToken ct = default)
    {
        return await _context.Articles
            .Include(a => a.Tags)
            .Where(a => a.IsTrending && a.Status == ArticleStatus.Published)
            .OrderByDescending(a => a.VoteCount)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<List<Article>> GetRelatedArticlesAsync(string slug, int limit = 3, CancellationToken ct = default)
    {
        var current = await _context.Articles
            .Include(a => a.Tags)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Slug == slug && a.Status == ArticleStatus.Published, ct);

        if (current == null) return [];

        var tagNames = current.Tags.Select(t => t.Name).ToList();
        var currentCategory = current.Category;

        return await _context.Articles
            .Include(a => a.Tags)
            .AsNoTracking()
            .Where(a => a.Slug != slug && a.Status == ArticleStatus.Published)
            .Where(a => a.Category == currentCategory || a.Tags.Any(t => tagNames.Contains(t.Name)))
            .OrderBy(a => a.Category == currentCategory ? 0 : 1)
            .ThenByDescending(a => a.VoteCount)
            .Take(limit)
            .Select(a => new Article
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                ShortDescription = a.ShortDescription,
                Category = a.Category,
                Tags = a.Tags,
                Author = a.Author,
                CreatedDate = a.CreatedDate,
                UpdatedDate = a.UpdatedDate,
                VoteCount = a.VoteCount,
                Status = a.Status,
                IsFeatured = a.IsFeatured,
                IsTrending = a.IsTrending
            })
            .ToListAsync(ct);
    }

    public Task<Article> AddAsync(Article article, CancellationToken ct = default)
    {
        _context.Articles.Add(article);
        return Task.FromResult(article);
    }

    public Task UpdateAsync(Article article, CancellationToken ct = default)
    {
        _context.Articles.Update(article);
        return Task.CompletedTask;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var article = await _context.Articles.FindAsync(new object[] { id }, ct);
        if (article == null) return false;

        _context.Articles.Remove(article);
        return true;
    }

    public async Task<int> IncrementVoteCountAsync(Guid id, CancellationToken ct = default)
    {
        if (_context.Database.IsRelational())
        {
            // Atomic SQL: UPDATE Articles SET VoteCount = VoteCount + 1 WHERE Id = @id
            var rowsAffected = await _context.Articles
                .Where(a => a.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    a => a.VoteCount, a => a.VoteCount + 1), ct);

            if (rowsAffected == 0) return -1;

            return await _context.Articles
                .Where(a => a.Id == id)
                .Select(a => a.VoteCount)
                .FirstAsync(ct);
        }

        // Fallback for InMemory provider (tests)
        var article = await _context.Articles.FindAsync(new object[] { id }, ct);
        if (article == null) return -1;

        article.VoteCount++;
        await _context.SaveChangesAsync(ct);
        return article.VoteCount;
    }
}
