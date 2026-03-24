using System.ComponentModel.DataAnnotations;

namespace Accelerator.Api.DTOs;

public class GetArticlesQuery
{
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 9;

    [MaxLength(20)]
    public string? SortBy { get; set; } = "recent";

    [MaxLength(50)]
    public string? Category { get; set; }

    [MaxLength(500)]
    public string? Tags { get; set; }

    [MaxLength(200)]
    public string? Search { get; set; }

    [DataType(DataType.Date)]
    public DateTime? DateFrom { get; set; }

    [DataType(DataType.Date)]
    public DateTime? DateTo { get; set; }

    [MaxLength(3)]
    public string TagMode { get; set; } = "any"; // "any" | "all"
}
