namespace Accelerator.Core.Interfaces;

/// <summary>
/// Custom business telemetry (events and metrics) emitted by Core services.
/// Core owns this abstraction so it never references a telemetry vendor SDK;
/// Infrastructure supplies the implementation (Application Insights by default).
/// </summary>
public interface IAppTelemetry
{
    void TrackEvent(string name, IDictionary<string, string>? properties = null);
    void TrackMetric(string name, double value);
}
