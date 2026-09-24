using System.Net;
using Accelerator.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Accelerator.Api.Tests.IntegrationTests;

/// <summary>
/// The "action" policy (vote endpoint) allows 10 requests per minute per client IP. Client IPs are
/// simulated with X-Forwarded-For, as the Container Apps ingress would set it.
/// </summary>
public class RateLimitingTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const int ActionPermitLimit = 10;
    private readonly HttpClient _client;

    public RateLimitingTests(WebApplicationFactory<Program> factory)
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
            });
        }).CreateClient();
    }

    private Task<HttpResponseMessage> VoteFrom(string clientIp)
    {
        // Unknown id: the endpoint returns 404, but the request still consumes a permit
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/articles/{Guid.NewGuid()}/vote");
        request.Headers.Add("X-Forwarded-For", clientIp);
        return _client.SendAsync(request);
    }

    [Fact]
    public async Task Vote_ShouldReturn429_WhenAClientExceedsItsLimit()
    {
        for (var i = 0; i < ActionPermitLimit; i++)
        {
            var allowed = await VoteFrom("203.0.113.10");
            allowed.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests, $"request {i + 1} is within the limit");
        }

        var rejected = await VoteFrom("203.0.113.10");

        rejected.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task Vote_ShouldNotLimitOtherClients_WhenOneClientIsLimited()
    {
        for (var i = 0; i <= ActionPermitLimit; i++)
        {
            await VoteFrom("203.0.113.20");
        }

        var otherClient = await VoteFrom("203.0.113.21");

        otherClient.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
    }
}
