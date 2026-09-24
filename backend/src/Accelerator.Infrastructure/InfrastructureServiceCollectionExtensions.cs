using Accelerator.Core.Interfaces;
using Accelerator.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.RateLimiting;

namespace Accelerator.Infrastructure;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Application Insights — monitoring and telemetry
        services.AddApplicationInsightsTelemetry(options =>
        {
            options.ConnectionString = configuration["ApplicationInsights:ConnectionString"];
            options.EnableAdaptiveSampling = true;
            options.EnableQuickPulseMetricStream = true;
        });
        services.AddSingleton<IAppTelemetry, ApplicationInsightsAppTelemetry>();

        // Caching and time abstraction
        services.AddMemoryCache();
        services.AddSingleton(TimeProvider.System);

        // Health checks
        services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>();

        // Client IP from X-Forwarded-For. Container Apps ingress appends the address it saw, and
        // ForwardLimit = 1 (default) reads only that last hop, so a client-supplied X-Forwarded-For
        // value can't choose its own rate-limit partition. The known-proxy lists are cleared because
        // the ingress address isn't fixed. That is only safe while the API is reachable solely
        // through a proxy that sets the header. See docs/ARCHITECTURE_DECISIONS.md §8.
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        // Rate limiting — protect against abuse. Each policy is partitioned per client IP and
        // counted per replica. See docs/ARCHITECTURE_DECISIONS.md §8.
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Sliding window for API endpoints: 50 requests per minute per client
            options.AddPolicy("api", context => RateLimitPartition.GetSlidingWindowLimiter(
                ClientPartitionKey(context),
                _ => new SlidingWindowRateLimiterOptions
                {
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 4,
                    PermitLimit = 50,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 5,
                }));

            // Strict limiter for the vote endpoint: 10 per minute per client, rejected
            // immediately rather than queued (a queued vote could wait up to a minute)
            options.AddPolicy("action", context => RateLimitPartition.GetFixedWindowLimiter(
                ClientPartitionKey(context),
                _ => new FixedWindowRateLimiterOptions
                {
                    Window = TimeSpan.FromMinutes(1),
                    PermitLimit = 10,
                    QueueLimit = 0,
                }));
        });

        return services;
    }

    private static string ClientPartitionKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
