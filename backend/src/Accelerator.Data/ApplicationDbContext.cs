using Accelerator.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Accelerator.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Article> Articles => Set<Article>();
    public DbSet<Tag> Tags => Set<Tag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Tags
        var tagArchitecture = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000001"), Name = "Architecture" };
        var tagApi = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000002"), Name = "API" };
        var tagTesting = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000003"), Name = "Testing" };
        var tagCleanCode = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000004"), Name = "Clean Code" };
        var tagDesignPatterns = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000005"), Name = "Design Patterns" };
        var tagPerformance = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000006"), Name = "Performance" };
        var tagSecurity = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000007"), Name = "Security" };
        var tagDevOps = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000008"), Name = "DevOps" };
        var tagBestPractices = new { Id = Guid.Parse("a0000000-0000-0000-0000-000000000009"), Name = "Best Practices" };

        modelBuilder.Entity<Tag>().HasData(
            tagArchitecture, tagApi, tagTesting, tagCleanCode, tagDesignPatterns,
            tagPerformance, tagSecurity, tagDevOps, tagBestPractices
        );

        // Articles (without Tags navigation - seeded via junction table)
        var article1Id = Guid.Parse("b0000000-0000-0000-0000-000000000001");
        var article2Id = Guid.Parse("b0000000-0000-0000-0000-000000000002");
        var article3Id = Guid.Parse("b0000000-0000-0000-0000-000000000003");

        modelBuilder.Entity<Article>().HasData(
            new
            {
                Id = article1Id,
                Title = "Getting Started with Clean Architecture",
                Slug = "getting-started-clean-architecture",
                ShortDescription = "Learn the principles of Clean Architecture and how to organize your codebase into well-defined layers with clear dependency rules.",
                FullContent = SeedContent.Article1FullContent,
                Category = Core.Enums.ArticleCategory.Guide,
                Author = "Jane Smith",
                CreatedDate = new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc),
                UpdatedDate = new DateTime(2024, 1, 20, 14, 30, 0, DateTimeKind.Utc),
                VoteCount = 42,
                Status = Core.Enums.ArticleStatus.Published,
                IsFeatured = true,
                IsTrending = false
            },
            new
            {
                Id = article2Id,
                Title = "Building RESTful APIs with ASP.NET Core",
                Slug = "building-restful-apis-aspnet-core",
                ShortDescription = "A practical guide to designing and implementing RESTful APIs with ASP.NET Core, covering routing, model binding, validation, and best practices.",
                FullContent = SeedContent.Article2FullContent,
                Category = Core.Enums.ArticleCategory.Tutorial,
                Author = "John Doe",
                CreatedDate = new DateTime(2024, 1, 18, 9, 0, 0, DateTimeKind.Utc),
                UpdatedDate = new DateTime(2024, 1, 18, 9, 0, 0, DateTimeKind.Utc),
                VoteCount = 38,
                Status = Core.Enums.ArticleStatus.Published,
                IsFeatured = false,
                IsTrending = true
            },
            new
            {
                Id = article3Id,
                Title = "Introduction to Test-Driven Development",
                Slug = "introduction-test-driven-development",
                ShortDescription = "Understand the Red-Green-Refactor cycle of TDD, how to write effective unit tests, and why writing tests first leads to better software design.",
                FullContent = SeedContent.Article3FullContent,
                Category = Core.Enums.ArticleCategory.Reference,
                Author = "Alice Johnson",
                CreatedDate = new DateTime(2024, 1, 22, 11, 0, 0, DateTimeKind.Utc),
                UpdatedDate = new DateTime(2024, 1, 25, 16, 45, 0, DateTimeKind.Utc),
                VoteCount = 56,
                Status = Core.Enums.ArticleStatus.Published,
                IsFeatured = true,
                IsTrending = true
            }
        );

        // ArticleTag junction table seed data
        modelBuilder.Entity<Article>()
            .HasMany(a => a.Tags)
            .WithMany(t => t.Articles)
            .UsingEntity(j => j.HasData(
                // Article 1: Architecture, Clean Code, Design Patterns
                new { ArticlesId = article1Id, TagsId = tagArchitecture.Id },
                new { ArticlesId = article1Id, TagsId = tagCleanCode.Id },
                new { ArticlesId = article1Id, TagsId = tagDesignPatterns.Id },
                // Article 2: API, Best Practices, Security
                new { ArticlesId = article2Id, TagsId = tagApi.Id },
                new { ArticlesId = article2Id, TagsId = tagBestPractices.Id },
                new { ArticlesId = article2Id, TagsId = tagSecurity.Id },
                // Article 3: Testing, Clean Code, Best Practices
                new { ArticlesId = article3Id, TagsId = tagTesting.Id },
                new { ArticlesId = article3Id, TagsId = tagCleanCode.Id },
                new { ArticlesId = article3Id, TagsId = tagBestPractices.Id }
            ));
    }
}
