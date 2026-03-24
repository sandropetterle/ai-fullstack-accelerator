using Accelerator.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
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

        // Caching and time abstraction
        services.AddMemoryCache();
        services.AddSingleton(TimeProvider.System);

        // Health checks
        services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>();

        // Rate limiting — protect against abuse
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Fixed window: 100 requests per minute per IP
            options.AddFixedWindowLimiter("fixed", config =>
            {
                config.Window = TimeSpan.FromMinutes(1);
                config.PermitLimit = 100;
                config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                config.QueueLimit = 10;
            });

            // Sliding window for API endpoints: 50 requests per minute
            options.AddSlidingWindowLimiter("api", config =>
            {
                config.Window = TimeSpan.FromMinutes(1);
                config.SegmentsPerWindow = 4;
                config.PermitLimit = 50;
                config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                config.QueueLimit = 5;
            });

            // Strict limiter for vote/action endpoint: 10 per minute per IP
            options.AddFixedWindowLimiter("action", config =>
            {
                config.Window = TimeSpan.FromMinutes(1);
                config.PermitLimit = 10;
                config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                config.QueueLimit = 2;
            });
        });

        return services;
    }
}
