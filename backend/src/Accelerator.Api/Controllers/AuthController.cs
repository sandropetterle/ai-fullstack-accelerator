using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Accelerator.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    /// <summary>
    /// Returns the currently authenticated user's identity and roles.
    /// Used by the frontend to verify session validity and determine role-based UI.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public ActionResult GetCurrentUser()
    {
        return Ok(new
        {
            Id = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value,
            Name = User.FindFirst("name")?.Value,
            Email = User.FindFirst("email")?.Value ?? User.FindFirst("preferred_username")?.Value,
            Roles = User.FindAll("roles").Select(c => c.Value).ToList()
        });
    }
}
