using Accelerator.Api.DTOs;
using Accelerator.Api.Mappers;
using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using Accelerator.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Accelerator.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/articles")]
[Route("api/articles")]
[Asp.Versioning.ApiVersion(1.0)]
public class ArticlesController : ControllerBase
{
    private readonly IArticleService _articleService;

    public ArticlesController(IArticleService articleService)
    {
        _articleService = articleService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ArticleListDto>>> GetArticles(
        [FromQuery] GetArticlesQuery query,
        CancellationToken ct = default)
    {
        var tagList = query.Tags?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

        var result = await _articleService.GetArticlesAsync(
            query.Page, query.PageSize, query.SortBy, query.Category, tagList, query.Search,
            query.DateFrom, query.DateTo, query.TagMode, ct);

        return Ok(new PaginatedResponse<ArticleListDto>
        {
            Items = result.Items.Select(ArticleMapper.ToListDto).ToList(),
            TotalCount = result.TotalCount,
            CurrentPage = result.CurrentPage,
            PageSize = result.PageSize,
            TotalPages = result.TotalPages
        });
    }

    [HttpGet("featured")]
    public async Task<ActionResult<IEnumerable<ArticleListDto>>> GetFeaturedArticles(CancellationToken ct = default)
    {
        var articles = await _articleService.GetFeaturedArticlesAsync(ct);
        return Ok(articles.Select(ArticleMapper.ToListDto));
    }

    [HttpGet("trending")]
    public async Task<ActionResult<IEnumerable<ArticleListDto>>> GetTrendingArticles(CancellationToken ct = default)
    {
        var articles = await _articleService.GetTrendingArticlesAsync(ct);
        return Ok(articles.Select(ArticleMapper.ToListDto));
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ArticleDetailDto>> GetArticleBySlug(string slug, CancellationToken ct = default)
    {
        var article = await _articleService.GetBySlugAsync(slug, ct);
        if (article == null) return NotFound();

        return Ok(ArticleMapper.ToDetailDto(article));
    }

    [HttpGet("{slug}/related")]
    public async Task<ActionResult<IEnumerable<ArticleListDto>>> GetRelatedArticles(string slug, CancellationToken ct = default)
    {
        var articles = await _articleService.GetRelatedArticlesAsync(slug, ct: ct);
        return Ok(articles.Select(ArticleMapper.ToListDto));
    }

    [HttpPost("{id:guid}/vote")]
    [EnableRateLimiting("action")]
    public async Task<ActionResult<VoteResponse>> VoteForArticle(Guid id, CancellationToken ct = default)
    {
        var newCount = await _articleService.VoteForArticleAsync(id, ct);
        if (newCount < 0) return NotFound();

        return Ok(new VoteResponse { ArticleId = id, VoteCount = newCount });
    }

    [Authorize(Policy = "RequireEditor")]
    [HttpPost]
    public async Task<ActionResult<ArticleDetailDto>> CreateArticle(CreateArticleDto dto, CancellationToken ct = default)
    {
        var category = Enum.Parse<ArticleCategory>(dto.Category, true);

        var article = new Article
        {
            Title = dto.Title,
            ShortDescription = dto.ShortDescription,
            FullContent = dto.FullContent,
            Category = category,
            Author = dto.Author
        };

        var created = await _articleService.CreateArticleAsync(article, dto.Tags, ct);
        var detailDto = ArticleMapper.ToDetailDto(created);

        return CreatedAtAction(nameof(GetArticleBySlug), new { slug = created.Slug }, detailDto);
    }

    [Authorize(Policy = "RequireEditor")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ArticleDetailDto>> UpdateArticle(Guid id, UpdateArticleDto dto, CancellationToken ct = default)
    {
        var category = Enum.Parse<ArticleCategory>(dto.Category, true);

        var updated = new Article
        {
            Title = dto.Title,
            ShortDescription = dto.ShortDescription,
            FullContent = dto.FullContent,
            Category = category,
            Author = dto.Author,
            IsFeatured = dto.IsFeatured,
            IsTrending = dto.IsTrending
        };

        var result = await _articleService.UpdateArticleAsync(id, updated, dto.Tags, ct);
        if (result == null) return NotFound();

        return Ok(ArticleMapper.ToDetailDto(result));
    }

    [Authorize(Policy = "RequireAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteArticle(Guid id, CancellationToken ct = default)
    {
        var deleted = await _articleService.DeleteArticleAsync(id, ct);
        if (!deleted) return NotFound();

        return NoContent();
    }
}
