using Accelerator.Core.Services;
using FluentAssertions;

namespace Accelerator.Core.Tests.Architecture;

/// <summary>
/// Enforces the Clean Architecture dependency rule (docs/ARCHITECTURE_DECISIONS.md §1):
/// Core must not depend on a web framework, ORM or telemetry vendor.
/// Those belong in Api, Data and Infrastructure behind Core-owned interfaces.
/// </summary>
public class CoreDependencyRuleTests
{
    private static readonly string[] ForbiddenPrefixes =
    [
        "Microsoft.AspNetCore",
        "Microsoft.EntityFrameworkCore",
        "Microsoft.ApplicationInsights",
    ];

    [Fact]
    public void CoreAssembly_ShouldNotReferenceFrameworkOrVendorAssemblies()
    {
        var referenced = typeof(ArticleService).Assembly
            .GetReferencedAssemblies()
            .Select(a => a.Name!)
            .ToList();

        referenced.Should().NotContain(
            name => ForbiddenPrefixes.Any(prefix => name.StartsWith(prefix)),
            "Core must stay free of framework and vendor dependencies (ADR §1)");
    }
}
