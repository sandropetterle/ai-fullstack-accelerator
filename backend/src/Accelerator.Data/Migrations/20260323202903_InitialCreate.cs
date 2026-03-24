using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Accelerator.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    ShortDescription = table.Column<string>(type: "TEXT", nullable: false),
                    FullContent = table.Column<string>(type: "TEXT", nullable: true),
                    Category = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Author = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    VoteCount = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IsFeatured = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTrending = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ArticleTag",
                columns: table => new
                {
                    ArticlesId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TagsId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleTag", x => new { x.ArticlesId, x.TagsId });
                    table.ForeignKey(
                        name: "FK_ArticleTag_Articles_ArticlesId",
                        column: x => x.ArticlesId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleTag_Tags_TagsId",
                        column: x => x.TagsId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Articles",
                columns: new[] { "Id", "Author", "Category", "CreatedDate", "FullContent", "IsFeatured", "IsTrending", "ShortDescription", "Slug", "Status", "Title", "UpdatedDate", "VoteCount" },
                values: new object[,]
                {
                    { new Guid("b0000000-0000-0000-0000-000000000001"), "Jane Smith", "Guide", new DateTime(2024, 1, 15, 10, 0, 0, 0, DateTimeKind.Utc), "## Overview\n\nClean Architecture is a software design philosophy that separates concerns into well-defined layers. The key rule is the **Dependency Rule**: source code dependencies must point inward — outer layers depend on inner layers, never the other way around.\n\n## Problem Statement\n\nWithout architectural boundaries, codebases become difficult to test, maintain, and evolve. Business logic gets entangled with frameworks, UI, and databases. Changing one part breaks another. Testing requires a running database or HTTP server.\n\n## Proposed Solution\n\nOrganize code into concentric layers:\n\n1. **Entities** — Core business objects with no external dependencies\n2. **Use Cases** — Application-specific business rules\n3. **Interface Adapters** — Controllers, presenters, gateways\n4. **Frameworks & Drivers** — UI, databases, external services\n\nThe inner layers define interfaces that outer layers implement — this is dependency inversion.\n\n## Implementation Steps\n\n1. **Identify your domain entities** — What are the core business objects? Extract them into a project with zero external dependencies.\n\n2. **Define use case interfaces** — Each use case is a single-responsibility class. Define repository interfaces here.\n\n3. **Implement repositories in the data layer** — The infrastructure implements the interfaces defined in the core.\n\n4. **Wire up with dependency injection** — The composition root (Program.cs) wires outer implementations to inner interfaces.\n\n5. **Test in isolation** — Unit test use cases with mocked repositories. No database required.\n\n## Code Samples\n\n```csharp\n// Core layer — no external dependencies\nnamespace MyApp.Core.Entities\n{\n    public class Order\n    {\n        public Guid Id { get; private set; }\n        public string CustomerName { get; private set; }\n        public decimal Total { get; private set; }\n\n        public Order(string customerName, decimal total)\n        {\n            Id = Guid.NewGuid();\n            CustomerName = customerName;\n            Total = total;\n        }\n    }\n}\n\n// Core layer — repository interface (defined here, implemented elsewhere)\nnamespace MyApp.Core.Interfaces\n{\n    public interface IOrderRepository\n    {\n        Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default);\n        Task AddAsync(Order order, CancellationToken ct = default);\n        Task<int> SaveChangesAsync(CancellationToken ct = default);\n    }\n}\n\n// Application layer — use case\nnamespace MyApp.Application.UseCases\n{\n    public class CreateOrderUseCase\n    {\n        private readonly IOrderRepository _orders;\n\n        public CreateOrderUseCase(IOrderRepository orders)\n        {\n            _orders = orders;\n        }\n\n        public async Task<Guid> ExecuteAsync(string customerName, decimal total, CancellationToken ct = default)\n        {\n            var order = new Order(customerName, total);\n            await _orders.AddAsync(order, ct);\n            await _orders.SaveChangesAsync(ct);\n            return order.Id;\n        }\n    }\n}\n\n// Infrastructure layer — EF Core implementation\nnamespace MyApp.Infrastructure.Repositories\n{\n    public class OrderRepository : IOrderRepository\n    {\n        private readonly AppDbContext _context;\n\n        public OrderRepository(AppDbContext context) => _context = context;\n\n        public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default)\n            => await _context.Orders.FindAsync(new object[] { id }, ct);\n\n        public async Task AddAsync(Order order, CancellationToken ct = default)\n            => await _context.Orders.AddAsync(order, ct);\n\n        public async Task<int> SaveChangesAsync(CancellationToken ct = default)\n            => await _context.SaveChangesAsync(ct);\n    }\n}\n```\n\n## Trade-offs\n\n### Pros\n- **Testability** — Use cases are pure C# with no framework dependencies\n- **Flexibility** — Swap database, UI, or external services without touching business logic\n- **Maintainability** — Clear boundaries make each layer independently understandable\n\n### Cons\n- **More files** — Each boundary requires interfaces and multiple implementations\n- **Indirection** — Can feel over-engineered for very simple CRUD applications\n- **Learning curve** — Team needs to agree on and follow the conventions consistently", true, false, "Learn the principles of Clean Architecture and how to organize your codebase into well-defined layers with clear dependency rules.", "getting-started-clean-architecture", "Published", "Getting Started with Clean Architecture", new DateTime(2024, 1, 20, 14, 30, 0, 0, DateTimeKind.Utc), 42 },
                    { new Guid("b0000000-0000-0000-0000-000000000002"), "John Doe", "Tutorial", new DateTime(2024, 1, 18, 9, 0, 0, 0, DateTimeKind.Utc), "## Overview\n\nREST (Representational State Transfer) is an architectural style for building web APIs. ASP.NET Core provides first-class support for building RESTful APIs with controllers, model binding, validation, and middleware.\n\n## Problem Statement\n\nAPIs need a consistent, predictable contract that clients can rely on. Without conventions, endpoints sprawl — inconsistent naming, mixed HTTP methods, unpredictable status codes. Clients need to understand your API to use it effectively.\n\n## Proposed Solution\n\nFollow REST conventions consistently: resource-based URLs, standard HTTP methods (GET/POST/PUT/DELETE), meaningful status codes, and JSON responses. ASP.NET Core's `[ApiController]` attribute enforces many of these automatically.\n\n## Implementation Steps\n\n1. **Design your resources** — Identify the nouns (not verbs). `/articles` not `/getArticles`.\n\n2. **Map HTTP methods to operations**:\n   - `GET /articles` — list\n   - `GET /articles/{id}` — get one\n   - `POST /articles` — create\n   - `PUT /articles/{id}` — replace\n   - `DELETE /articles/{id}` — delete\n\n3. **Use appropriate status codes**:\n   - `200 OK` — success with body\n   - `201 Created` — resource created (include `Location` header)\n   - `204 No Content` — success without body\n   - `400 Bad Request` — validation failure\n   - `401 Unauthorized` — not authenticated\n   - `403 Forbidden` — not authorized\n   - `404 Not Found` — resource doesn't exist\n   - `500 Internal Server Error` — unhandled exception\n\n4. **Validate inputs** — Use FluentValidation or data annotations. `[ApiController]` returns 400 automatically on model validation failure.\n\n5. **Handle errors consistently** — Use middleware to catch unhandled exceptions and return a consistent error format.\n\n## Code Samples\n\n```csharp\n[ApiController]\n[Route(\"api/articles\")]\npublic class ArticlesController : ControllerBase\n{\n    private readonly IArticleService _service;\n\n    public ArticlesController(IArticleService service) => _service = service;\n\n    // GET api/articles\n    [HttpGet]\n    public async Task<ActionResult<IEnumerable<ArticleDto>>> GetAll(CancellationToken ct)\n    {\n        var articles = await _service.GetAllAsync(ct);\n        return Ok(articles);\n    }\n\n    // GET api/articles/{slug}\n    [HttpGet(\"{slug}\")]\n    public async Task<ActionResult<ArticleDto>> GetBySlug(string slug, CancellationToken ct)\n    {\n        var article = await _service.GetBySlugAsync(slug, ct);\n        return article is null ? NotFound() : Ok(article);\n    }\n\n    // POST api/articles\n    [HttpPost]\n    [Authorize(Policy = \"RequireEditor\")]\n    public async Task<ActionResult<ArticleDto>> Create(CreateArticleDto dto, CancellationToken ct)\n    {\n        var created = await _service.CreateAsync(dto, ct);\n        return CreatedAtAction(nameof(GetBySlug), new { slug = created.Slug }, created);\n    }\n\n    // PUT api/articles/{id}\n    [HttpPut(\"{id:guid}\")]\n    [Authorize(Policy = \"RequireEditor\")]\n    public async Task<ActionResult<ArticleDto>> Update(Guid id, UpdateArticleDto dto, CancellationToken ct)\n    {\n        var result = await _service.UpdateAsync(id, dto, ct);\n        return result is null ? NotFound() : Ok(result);\n    }\n\n    // DELETE api/articles/{id}\n    [HttpDelete(\"{id:guid}\")]\n    [Authorize(Policy = \"RequireAdmin\")]\n    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)\n    {\n        var deleted = await _service.DeleteAsync(id, ct);\n        return deleted ? NoContent() : NotFound();\n    }\n}\n```\n\n## Trade-offs\n\n### Pros\n- **Stateless** — Each request contains all information needed; easy to scale horizontally\n- **Cacheable** — GET responses can be cached at multiple levels\n- **Uniform interface** — Clients learn once, use everywhere\n- **Tooling** — OpenAPI/Swagger, Postman, HttpClient all work seamlessly\n\n### Cons\n- **Over-fetching/under-fetching** — Fixed response shapes may not match every client's needs\n- **Multiple round trips** — Related resources may require multiple requests\n- **Versioning complexity** — Breaking changes require careful API versioning strategy", false, true, "A practical guide to designing and implementing RESTful APIs with ASP.NET Core, covering routing, model binding, validation, and best practices.", "building-restful-apis-aspnet-core", "Published", "Building RESTful APIs with ASP.NET Core", new DateTime(2024, 1, 18, 9, 0, 0, 0, DateTimeKind.Utc), 38 },
                    { new Guid("b0000000-0000-0000-0000-000000000003"), "Alice Johnson", "Reference", new DateTime(2024, 1, 22, 11, 0, 0, 0, DateTimeKind.Utc), "## Overview\n\nTest-Driven Development (TDD) is a software development practice where you write tests before writing production code. The cycle is: **Red → Green → Refactor**. Write a failing test, make it pass with minimal code, then clean up.\n\n## Problem Statement\n\nCode written without tests is harder to change safely. Bugs are discovered late, in production, where they are expensive to fix. Without tests, refactoring becomes risky — you can't be sure you haven't broken something. Fear of breakage leads to stagnating codebases.\n\n## Proposed Solution\n\nAdopt TDD as a development discipline. Each new feature or bug fix starts with a test. The test describes the desired behavior. Only then do you write the code to make it pass.\n\n**The three laws of TDD:**\n1. You may not write production code unless it's to make a failing test pass\n2. You may not write more of a unit test than is sufficient to fail\n3. You may not write more production code than is sufficient to make the failing test pass\n\n## Implementation Steps\n\n1. **Write a failing test** — Describe what the code should do. Don't worry about implementation yet.\n\n2. **Make it pass** — Write the simplest possible code. Don't over-engineer.\n\n3. **Refactor** — Clean up duplication, improve naming, extract methods. Tests are your safety net.\n\n4. **Repeat** — Each small cycle adds one behavior at a time.\n\n5. **Use test doubles** — Mock external dependencies (databases, HTTP clients) so tests run fast and in isolation.\n\n## Code Samples\n\n```csharp\n// Step 1: Write the failing test\npublic class ArticleServiceTests\n{\n    [Fact]\n    public async Task CreateArticle_SetsSlugFromTitle()\n    {\n        // Arrange\n        var repo = new Mock<IArticleRepository>();\n        repo.Setup(r => r.AddAsync(It.IsAny<Article>(), default))\n            .ReturnsAsync((Article a, CancellationToken _) => a);\n        var service = new ArticleService(repo.Object, /* ... */);\n\n        // Act\n        var result = await service.CreateArticleAsync(\n            new Article { Title = \"Hello World\" }, new List<string>());\n\n        // Assert — this fails until we implement slug generation\n        result.Slug.Should().Be(\"hello-world\");\n    }\n}\n\n// Step 2: Make it pass — implement slug generation\npublic class ArticleService : IArticleService\n{\n    public async Task<Article> CreateArticleAsync(Article article, List<string> tagNames, CancellationToken ct = default)\n    {\n        article.Id = Guid.NewGuid();\n        article.Slug = Slug.FromTitle(article.Title); // implement this\n        article.CreatedDate = _timeProvider.GetUtcNow().UtcDateTime;\n        article.Status = ArticleStatus.Published;\n\n        var created = await _articleRepository.AddAsync(article, ct);\n        await _unitOfWork.SaveChangesAsync(ct);\n        return created;\n    }\n}\n\n// Step 3: Refactor — extract slug logic to value object\npublic static class Slug\n{\n    public static string FromTitle(string title)\n    {\n        return title.ToLowerInvariant()\n            .Replace(\" \", \"-\")\n            .Replace(\"--\", \"-\")\n            .Trim('-');\n    }\n}\n```\n\n## Testing Patterns\n\n**Arrange / Act / Assert** — Structure every test the same way:\n```csharp\n[Fact]\npublic async Task GetBySlug_ReturnsNull_WhenNotFound()\n{\n    // Arrange\n    var repo = new Mock<IArticleRepository>();\n    repo.Setup(r => r.GetBySlugAsync(\"missing\", default)).ReturnsAsync((Article?)null);\n    var service = new ArticleService(repo.Object, /* ... */);\n\n    // Act\n    var result = await service.GetBySlugAsync(\"missing\");\n\n    // Assert\n    result.Should().BeNull();\n}\n```\n\n**Theory tests** — Test multiple inputs with one test method:\n```csharp\n[Theory]\n[InlineData(\"Hello World\", \"hello-world\")]\n[InlineData(\"C# Best Practices\", \"c-best-practices\")]\n[InlineData(\"  Multiple   Spaces  \", \"multiple-spaces\")]\npublic void Slug_FromTitle_GeneratesCorrectSlug(string input, string expected)\n{\n    Slug.FromTitle(input).Should().Be(expected);\n}\n```\n\n## Trade-offs\n\n### Pros\n- **Confidence** — Tests prove your code works as expected\n- **Design feedback** — Hard-to-test code is a signal of poor design\n- **Documentation** — Tests describe intended behavior better than comments\n- **Regression safety** — Breaking changes are caught immediately\n\n### Cons\n- **Slower initially** — Writing tests takes time upfront\n- **Maintenance** — Tests must be updated when behavior changes\n- **Learning curve** — Writing good tests is a skill that takes practice\n- **False confidence** — Poor tests (testing implementation not behavior) give false security", true, true, "Understand the Red-Green-Refactor cycle of TDD, how to write effective unit tests, and why writing tests first leads to better software design.", "introduction-test-driven-development", "Published", "Introduction to Test-Driven Development", new DateTime(2024, 1, 25, 16, 45, 0, 0, DateTimeKind.Utc), 56 }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { new Guid("a0000000-0000-0000-0000-000000000001"), "Architecture" },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), "API" },
                    { new Guid("a0000000-0000-0000-0000-000000000003"), "Testing" },
                    { new Guid("a0000000-0000-0000-0000-000000000004"), "Clean Code" },
                    { new Guid("a0000000-0000-0000-0000-000000000005"), "Design Patterns" },
                    { new Guid("a0000000-0000-0000-0000-000000000006"), "Performance" },
                    { new Guid("a0000000-0000-0000-0000-000000000007"), "Security" },
                    { new Guid("a0000000-0000-0000-0000-000000000008"), "DevOps" },
                    { new Guid("a0000000-0000-0000-0000-000000000009"), "Best Practices" }
                });

            migrationBuilder.InsertData(
                table: "ArticleTag",
                columns: new[] { "ArticlesId", "TagsId" },
                values: new object[,]
                {
                    { new Guid("b0000000-0000-0000-0000-000000000001"), new Guid("a0000000-0000-0000-0000-000000000001") },
                    { new Guid("b0000000-0000-0000-0000-000000000001"), new Guid("a0000000-0000-0000-0000-000000000004") },
                    { new Guid("b0000000-0000-0000-0000-000000000001"), new Guid("a0000000-0000-0000-0000-000000000005") },
                    { new Guid("b0000000-0000-0000-0000-000000000002"), new Guid("a0000000-0000-0000-0000-000000000002") },
                    { new Guid("b0000000-0000-0000-0000-000000000002"), new Guid("a0000000-0000-0000-0000-000000000007") },
                    { new Guid("b0000000-0000-0000-0000-000000000002"), new Guid("a0000000-0000-0000-0000-000000000009") },
                    { new Guid("b0000000-0000-0000-0000-000000000003"), new Guid("a0000000-0000-0000-0000-000000000003") },
                    { new Guid("b0000000-0000-0000-0000-000000000003"), new Guid("a0000000-0000-0000-0000-000000000004") },
                    { new Guid("b0000000-0000-0000-0000-000000000003"), new Guid("a0000000-0000-0000-0000-000000000009") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Category",
                table: "Articles",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_CreatedDate",
                table: "Articles",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_IsFeatured",
                table: "Articles",
                column: "IsFeatured");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_IsTrending",
                table: "Articles",
                column: "IsTrending");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Slug",
                table: "Articles",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Status",
                table: "Articles",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_VoteCount",
                table: "Articles",
                column: "VoteCount");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTag_TagsId",
                table: "ArticleTag",
                column: "TagsId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_Name",
                table: "Tags",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArticleTag");

            migrationBuilder.DropTable(
                name: "Articles");

            migrationBuilder.DropTable(
                name: "Tags");
        }
    }
}
