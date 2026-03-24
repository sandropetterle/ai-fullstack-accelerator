using System.ComponentModel.DataAnnotations;

namespace Accelerator.Core.Entities;

public class Tag : BaseEntity
{
    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public List<Article> Articles { get; set; } = new();
}
