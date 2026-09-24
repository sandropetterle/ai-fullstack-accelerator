using System.Net;
using Accelerator.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Accelerator.Api.Tests.IntegrationTests;

/// <summary>
/// /health is liveness (no checks) and /health/ready is readiness (all checks). The Container Apps
/// liveness probe uses /health, so a failing dependency must not fail it.
/// </summary>
public class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        var databaseName = $"TestDb_{Guid.NewGuid()}";
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase(databaseName));

                // Simulates a dependency outage (e.g. the database is unreachable)
                services.AddHealthChecks()
                    .AddCheck("simulated-dependency", () => HealthCheckResult.Unhealthy("down"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task Liveness_ShouldReturnHealthy_EvenWhenADependencyIsDown()
    {
        var response = await _client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("Healthy");
    }

    [Fact]
    public async Task Readiness_ShouldReturn503_WhenADependencyIsDown()
    {
        var response = await _client.GetAsync("/health/ready");

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        (await response.Content.ReadAsStringAsync()).Should().Be("Unhealthy");
    }
}
