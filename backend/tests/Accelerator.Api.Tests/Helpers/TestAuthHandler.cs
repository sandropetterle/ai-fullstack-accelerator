using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Accelerator.Api.Tests.Helpers;

/// <summary>
/// A fake authentication handler for integration tests.
///
/// Reads the "X-Test-Roles" request header (comma-separated) to determine which
/// roles to assign. If the header is absent the request is treated as unauthenticated.
///
/// Usage in tests:
///   - Unauthenticated:  client.GetAsync("/endpoint")
///   - Authenticated:    client.SendAsync(req => req.Headers.Add("X-Test-Roles", "Admin"))
///   - Or use the extension methods below for convenience.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestAuth";
    public const string RolesHeader = "X-Test-Roles";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(RolesHeader, out var rolesHeader) ||
            string.IsNullOrWhiteSpace(rolesHeader))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var roles = rolesHeader.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var claims = new List<Claim>
        {
            new Claim("sub", "test-user-id"),
            new Claim("name", "Test User"),
            new Claim("email", "test@example.com"),
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim("roles", role));
        }

        var identity = new ClaimsIdentity(claims, SchemeName, "name", "roles");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

/// <summary>
/// Convenience extension methods for building authenticated test requests.
/// </summary>
public static class HttpClientAuthExtensions
{
    public static HttpRequestMessage WithRole(this HttpRequestMessage request, string role)
    {
        request.Headers.Add(TestAuthHandler.RolesHeader, role);
        return request;
    }

    public static HttpRequestMessage WithRoles(this HttpRequestMessage request, params string[] roles)
    {
        request.Headers.Add(TestAuthHandler.RolesHeader, string.Join(",", roles));
        return request;
    }
}
