using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Accelerator.Api.Authentication;

/// <summary>
/// Default scheme when no OIDC provider is configured (Authentication:Authority empty, e.g. local dev).
/// It never authenticates anyone, so public endpoints work and protected endpoints get the standard
/// challenge (401) or forbid (403) instead of throwing "No authenticationScheme was specified".
/// </summary>
public class UnconfiguredAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "Unconfigured";

    public UnconfiguredAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync() =>
        Task.FromResult(AuthenticateResult.NoResult());
}
