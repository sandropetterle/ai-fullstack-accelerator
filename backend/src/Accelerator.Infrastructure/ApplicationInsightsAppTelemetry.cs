using Accelerator.Core.Interfaces;
using Microsoft.ApplicationInsights;

namespace Accelerator.Infrastructure;

/// <summary>
/// Application Insights implementation of <see cref="IAppTelemetry"/>.
/// </summary>
public class ApplicationInsightsAppTelemetry : IAppTelemetry
{
    private readonly TelemetryClient _client;

    public ApplicationInsightsAppTelemetry(TelemetryClient client)
    {
        _client = client;
    }

    public void TrackEvent(string name, IDictionary<string, string>? properties = null) =>
        _client.TrackEvent(name, properties);

    public void TrackMetric(string name, double value) =>
        _client.TrackMetric(name, value);
}
