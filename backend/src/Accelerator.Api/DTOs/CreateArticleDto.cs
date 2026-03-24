using System.ComponentModel.DataAnnotations;

namespace Accelerator.Api.DTOs;

public class CreateArticleDto
{
    [Required, MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string ShortDescription { get; set; } = string.Empty;

    [MaxLength(50000)]
    public string? FullContent { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = new();

    [MaxLength(100)]
    public string? Author { get; set; }
}
