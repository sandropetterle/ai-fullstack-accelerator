namespace Accelerator.Data;

internal static class SeedContent
{
    internal const string Article1FullContent = """
## Overview

Clean Architecture is a software design philosophy that separates concerns into well-defined layers. The key rule is the **Dependency Rule**: source code dependencies must point inward — outer layers depend on inner layers, never the other way around.

## Problem Statement

Without architectural boundaries, codebases become difficult to test, maintain, and evolve. Business logic gets entangled with frameworks, UI, and databases. Changing one part breaks another. Testing requires a running database or HTTP server.

## Proposed Solution

Organize code into concentric layers:

1. **Entities** — Core business objects with no external dependencies
2. **Use Cases** — Application-specific business rules
3. **Interface Adapters** — Controllers, presenters, gateways
4. **Frameworks & Drivers** — UI, databases, external services

The inner layers define interfaces that outer layers implement — this is dependency inversion.

## Implementation Steps

1. **Identify your domain entities** — What are the core business objects? Extract them into a project with zero external dependencies.

2. **Define use case interfaces** — Each use case is a single-responsibility class. Define repository interfaces here.

3. **Implement repositories in the data layer** — The infrastructure implements the interfaces defined in the core.

4. **Wire up with dependency injection** — The composition root (Program.cs) wires outer implementations to inner interfaces.

5. **Test in isolation** — Unit test use cases with mocked repositories. No database required.

## Code Samples

```csharp
// Core layer — no external dependencies
namespace MyApp.Core.Entities
{
    public class Order
    {
        public Guid Id { get; private set; }
        public string CustomerName { get; private set; }
        public decimal Total { get; private set; }

        public Order(string customerName, decimal total)
        {
            Id = Guid.NewGuid();
            CustomerName = customerName;
            Total = total;
        }
    }
}

// Core layer — repository interface (defined here, implemented elsewhere)
namespace MyApp.Core.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task AddAsync(Order order, CancellationToken ct = default);
        Task<int> SaveChangesAsync(CancellationToken ct = default);
    }
}

// Application layer — use case
namespace MyApp.Application.UseCases
{
    public class CreateOrderUseCase
    {
        private readonly IOrderRepository _orders;

        public CreateOrderUseCase(IOrderRepository orders)
        {
            _orders = orders;
        }

        public async Task<Guid> ExecuteAsync(string customerName, decimal total, CancellationToken ct = default)
        {
            var order = new Order(customerName, total);
            await _orders.AddAsync(order, ct);
            await _orders.SaveChangesAsync(ct);
            return order.Id;
        }
    }
}

// Infrastructure layer — EF Core implementation
namespace MyApp.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _context;

        public OrderRepository(AppDbContext context) => _context = context;

        public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default)
            => await _context.Orders.FindAsync(new object[] { id }, ct);

        public async Task AddAsync(Order order, CancellationToken ct = default)
            => await _context.Orders.AddAsync(order, ct);

        public async Task<int> SaveChangesAsync(CancellationToken ct = default)
            => await _context.SaveChangesAsync(ct);
    }
}
```

## Trade-offs

### Pros
- **Testability** — Use cases are pure C# with no framework dependencies
- **Flexibility** — Swap database, UI, or external services without touching business logic
- **Maintainability** — Clear boundaries make each layer independently understandable

### Cons
- **More files** — Each boundary requires interfaces and multiple implementations
- **Indirection** — Can feel over-engineered for very simple CRUD applications
- **Learning curve** — Team needs to agree on and follow the conventions consistently
""";

    internal const string Article2FullContent = """
## Overview

REST (Representational State Transfer) is an architectural style for building web APIs. ASP.NET Core provides first-class support for building RESTful APIs with controllers, model binding, validation, and middleware.

## Problem Statement

APIs need a consistent, predictable contract that clients can rely on. Without conventions, endpoints sprawl — inconsistent naming, mixed HTTP methods, unpredictable status codes. Clients need to understand your API to use it effectively.

## Proposed Solution

Follow REST conventions consistently: resource-based URLs, standard HTTP methods (GET/POST/PUT/DELETE), meaningful status codes, and JSON responses. ASP.NET Core's `[ApiController]` attribute enforces many of these automatically.

## Implementation Steps

1. **Design your resources** — Identify the nouns (not verbs). `/articles` not `/getArticles`.

2. **Map HTTP methods to operations**:
   - `GET /articles` — list
   - `GET /articles/{id}` — get one
   - `POST /articles` — create
   - `PUT /articles/{id}` — replace
   - `DELETE /articles/{id}` — delete

3. **Use appropriate status codes**:
   - `200 OK` — success with body
   - `201 Created` — resource created (include `Location` header)
   - `204 No Content` — success without body
   - `400 Bad Request` — validation failure
   - `401 Unauthorized` — not authenticated
   - `403 Forbidden` — not authorized
   - `404 Not Found` — resource doesn't exist
   - `500 Internal Server Error` — unhandled exception

4. **Validate inputs** — Use FluentValidation or data annotations. `[ApiController]` returns 400 automatically on model validation failure.

5. **Handle errors consistently** — Use middleware to catch unhandled exceptions and return a consistent error format.

## Code Samples

```csharp
[ApiController]
[Route("api/articles")]
public class ArticlesController : ControllerBase
{
    private readonly IArticleService _service;

    public ArticlesController(IArticleService service) => _service = service;

    // GET api/articles
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArticleDto>>> GetAll(CancellationToken ct)
    {
        var articles = await _service.GetAllAsync(ct);
        return Ok(articles);
    }

    // GET api/articles/{slug}
    [HttpGet("{slug}")]
    public async Task<ActionResult<ArticleDto>> GetBySlug(string slug, CancellationToken ct)
    {
        var article = await _service.GetBySlugAsync(slug, ct);
        return article is null ? NotFound() : Ok(article);
    }

    // POST api/articles
    [HttpPost]
    [Authorize(Policy = "RequireEditor")]
    public async Task<ActionResult<ArticleDto>> Create(CreateArticleDto dto, CancellationToken ct)
    {
        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetBySlug), new { slug = created.Slug }, created);
    }

    // PUT api/articles/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireEditor")]
    public async Task<ActionResult<ArticleDto>> Update(Guid id, UpdateArticleDto dto, CancellationToken ct)
    {
        var result = await _service.UpdateAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    // DELETE api/articles/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        var deleted = await _service.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
```

## Trade-offs

### Pros
- **Stateless** — Each request contains all information needed; easy to scale horizontally
- **Cacheable** — GET responses can be cached at multiple levels
- **Uniform interface** — Clients learn once, use everywhere
- **Tooling** — OpenAPI/Swagger, Postman, HttpClient all work seamlessly

### Cons
- **Over-fetching/under-fetching** — Fixed response shapes may not match every client's needs
- **Multiple round trips** — Related resources may require multiple requests
- **Versioning complexity** — Breaking changes require careful API versioning strategy
""";

    internal const string Article3FullContent = """
## Overview

Test-Driven Development (TDD) is a software development practice where you write tests before writing production code. The cycle is: **Red → Green → Refactor**. Write a failing test, make it pass with minimal code, then clean up.

## Problem Statement

Code written without tests is harder to change safely. Bugs are discovered late, in production, where they are expensive to fix. Without tests, refactoring becomes risky — you can't be sure you haven't broken something. Fear of breakage leads to stagnating codebases.

## Proposed Solution

Adopt TDD as a development discipline. Each new feature or bug fix starts with a test. The test describes the desired behavior. Only then do you write the code to make it pass.

**The three laws of TDD:**
1. You may not write production code unless it's to make a failing test pass
2. You may not write more of a unit test than is sufficient to fail
3. You may not write more production code than is sufficient to make the failing test pass

## Implementation Steps

1. **Write a failing test** — Describe what the code should do. Don't worry about implementation yet.

2. **Make it pass** — Write the simplest possible code. Don't over-engineer.

3. **Refactor** — Clean up duplication, improve naming, extract methods. Tests are your safety net.

4. **Repeat** — Each small cycle adds one behavior at a time.

5. **Use test doubles** — Mock external dependencies (databases, HTTP clients) so tests run fast and in isolation.

## Code Samples

```csharp
// Step 1: Write the failing test
public class ArticleServiceTests
{
    [Fact]
    public async Task CreateArticle_SetsSlugFromTitle()
    {
        // Arrange
        var repo = new Mock<IArticleRepository>();
        repo.Setup(r => r.AddAsync(It.IsAny<Article>(), default))
            .ReturnsAsync((Article a, CancellationToken _) => a);
        var service = new ArticleService(repo.Object, /* ... */);

        // Act
        var result = await service.CreateArticleAsync(
            new Article { Title = "Hello World" }, new List<string>());

        // Assert — this fails until we implement slug generation
        result.Slug.Should().Be("hello-world");
    }
}

// Step 2: Make it pass — implement slug generation
public class ArticleService : IArticleService
{
    public async Task<Article> CreateArticleAsync(Article article, List<string> tagNames, CancellationToken ct = default)
    {
        article.Id = Guid.NewGuid();
        article.Slug = Slug.FromTitle(article.Title); // implement this
        article.CreatedDate = _timeProvider.GetUtcNow().UtcDateTime;
        article.Status = ArticleStatus.Published;

        var created = await _articleRepository.AddAsync(article, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return created;
    }
}

// Step 3: Refactor — extract slug logic to value object
public static class Slug
{
    public static string FromTitle(string title)
    {
        return title.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("--", "-")
            .Trim('-');
    }
}
```

## Testing Patterns

**Arrange / Act / Assert** — Structure every test the same way:
```csharp
[Fact]
public async Task GetBySlug_ReturnsNull_WhenNotFound()
{
    // Arrange
    var repo = new Mock<IArticleRepository>();
    repo.Setup(r => r.GetBySlugAsync("missing", default)).ReturnsAsync((Article?)null);
    var service = new ArticleService(repo.Object, /* ... */);

    // Act
    var result = await service.GetBySlugAsync("missing");

    // Assert
    result.Should().BeNull();
}
```

**Theory tests** — Test multiple inputs with one test method:
```csharp
[Theory]
[InlineData("Hello World", "hello-world")]
[InlineData("C# Best Practices", "c-best-practices")]
[InlineData("  Multiple   Spaces  ", "multiple-spaces")]
public void Slug_FromTitle_GeneratesCorrectSlug(string input, string expected)
{
    Slug.FromTitle(input).Should().Be(expected);
}
```

## Trade-offs

### Pros
- **Confidence** — Tests prove your code works as expected
- **Design feedback** — Hard-to-test code is a signal of poor design
- **Documentation** — Tests describe intended behavior better than comments
- **Regression safety** — Breaking changes are caught immediately

### Cons
- **Slower initially** — Writing tests takes time upfront
- **Maintenance** — Tests must be updated when behavior changes
- **Learning curve** — Writing good tests is a skill that takes practice
- **False confidence** — Poor tests (testing implementation not behavior) give false security
""";
}
