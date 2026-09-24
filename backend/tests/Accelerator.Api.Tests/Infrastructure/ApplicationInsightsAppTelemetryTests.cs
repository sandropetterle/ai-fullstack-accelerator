using Accelerator.Infrastructure;
using FluentAssertions;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;

namespace Accelerator.Api.Tests.Infrastructure;

public class ApplicationInsightsAppTelemetryTests
{
    private readonly FakeTelemetryChannel _channel = new();
    private readonly TelemetryClient _client;
    private readonly ApplicationInsightsAppTelemetry _sut;

    public ApplicationInsightsAppTelemetryTests()
    {
        _client = new TelemetryClient(new TelemetryConfiguration { TelemetryChannel = _channel });
        _sut = new ApplicationInsightsAppTelemetry(_client);
    }

    [Fact]
    public void TrackEvent_ShouldForwardNameAndPropertiesToTelemetryClient()
    {
        _sut.TrackEvent("ArticleViewed", new Dictionary<string, string> { ["slug"] = "hello-world" });

        _client.Flush();
        var evt = _channel.Items.OfType<EventTelemetry>().Single();
        evt.Name.Should().Be("ArticleViewed");
        evt.Properties["slug"].Should().Be("hello-world");
    }

    [Fact]
    public void TrackMetric_ShouldForwardNameAndValueToTelemetryClient()
    {
        _sut.TrackMetric("FeaturedArticlesCacheHit", 1);

        _client.Flush();
        var metric = _channel.Items.OfType<MetricTelemetry>().Single();
        metric.Name.Should().Be("FeaturedArticlesCacheHit");
        metric.Sum.Should().Be(1);
    }
}

/// <summary>
/// Fake Application Insights channel that captures telemetry items in memory for assertions
/// </summary>
public class FakeTelemetryChannel : ITelemetryChannel
{
    public List<ITelemetry> Items { get; } = new();
    public bool? DeveloperMode { get; set; }
    public string? EndpointAddress { get; set; }

    public void Send(ITelemetry item) => Items.Add(item);
    public void Flush() { }
    public void Dispose() { }
}
