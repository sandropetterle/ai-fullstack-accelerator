using System.ComponentModel.DataAnnotations;
using Accelerator.Core.Enums;

namespace Accelerator.Core.Entities;

public class Article : BaseEntity
{
    [Required, MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    public string ShortDescription { get; set; } = string.Empty;

    public string? FullContent { get; set; }

    public ArticleCategory Category { get; set; }

    public List<Tag> Tags { get; set; } = new();

    [MaxLength(100)]
    public string? Author { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime UpdatedDate { get; set; }

    public int VoteCount { get; set; }

    public ArticleStatus Status { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsTrending { get; set; }
}
