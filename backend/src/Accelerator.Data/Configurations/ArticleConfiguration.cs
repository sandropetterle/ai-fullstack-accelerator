using Accelerator.Core.Entities;
using Accelerator.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Accelerator.Data.Configurations;

public class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title).IsRequired().HasMaxLength(255);
        builder.Property(a => a.Slug).IsRequired().HasMaxLength(255);
        builder.Property(a => a.ShortDescription).IsRequired();
        builder.Property(a => a.Author).HasMaxLength(100);

        // Enum stored as string to match frontend expectations
        builder.Property(a => a.Category)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // Indexes
        builder.HasIndex(a => a.Slug).IsUnique();
        builder.HasIndex(a => a.Category);
        builder.HasIndex(a => a.Status);
        builder.HasIndex(a => a.CreatedDate);
        builder.HasIndex(a => a.VoteCount);
        builder.HasIndex(a => a.IsFeatured);
        builder.HasIndex(a => a.IsTrending);
    }
}
