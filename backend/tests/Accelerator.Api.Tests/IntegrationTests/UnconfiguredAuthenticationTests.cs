using System.Net;
using System.Net.Http.Json;
using Accelerator.Api.DTOs;
using Accelerator.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Accelerator.Api.Tests.IntegrationTests;

/// <summary>
/// Boots the API the way local dev does without an OIDC provider (Authentication:Authority empty)
/// and without the test auth scheme, to check that protected endpoints return 401 rather than 500.
/// </summary>
public class UnconfiguredAuthenticationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public UnconfiguredAuthenticationTests(WebApplicationFactory<Program> factory)
    {
        var databaseName = $"TestDb_{Guid.NewGuid()}";
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Authentication:Authority", string.Empty);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase(databaseName));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task ProtectedEndpoint_ShouldReturn401_WhenNoAuthorityConfigured()
    {
        var dto = new CreateArticleDto
        {
            Title = "A", ShortDescription = "D", Category = "Guide", Tags = new List<string>()
        };

        var response = await _client.PostAsJsonAsync("/api/articles", dto);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AuthMe_ShouldReturn401_WhenNoAuthorityConfigured()
    {
        var response = await _client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PublicEndpoint_ShouldReturn200_WhenNoAuthorityConfigured()
    {
        var response = await _client.GetAsync("/api/articles");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
