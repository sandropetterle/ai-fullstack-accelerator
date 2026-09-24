# Health API Reference

**Last Updated:** 2026-09-24
**Audience:** DevOps, Infrastructure engineers
**Purpose:** Reference for the `/health` endpoints used for liveness and readiness probes.

See [API_REFERENCE_INDEX.md](API_REFERENCE_INDEX.md) for base URLs, auth, and rate limiting.

---

## Endpoint Summary

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/health` | None | Liveness probe — checks application is running |
| GET | `/health/ready` | None | Readiness probe — checks DB connectivity |

Health endpoints are **not** subject to API rate limiting.

---

## GET /health

Liveness check. Returns immediately if the application is running. CI/CD pipelines check for the string `"Healthy"` in the response body.

### Example Response

```
200 OK
Content-Type: text/plain

Healthy
```

---

## GET /health/ready

Readiness check. Runs every registered health check, including the EF Core `DbContext` check (named `ApplicationDbContext`), and confirms the database connection is healthy before the container receives traffic. The response body is the aggregate status as plain text; per-check details go to the application log.

### Example Response (healthy)

```
200 OK
Content-Type: text/plain

Healthy
```

### Example Response (unhealthy)

```
503 Service Unavailable
Content-Type: text/plain

Unhealthy
```

### Health Check Configuration

Registered in `AddInfrastructure()` (`InfrastructureServiceCollectionExtensions.cs`) and mapped in `Program.cs`:

```csharp
services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

// Liveness: no checks, so a database outage doesn't restart healthy replicas
app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false });
// Readiness: all registered checks
app.MapHealthChecks("/health/ready");
```

The Container Apps startup and liveness probes use `/health`; the readiness probe uses `/health/ready` (`infrastructure/modules/containerApps.bicep`). Both behaviours are covered by `HealthEndpointTests`.

See [MONITORING_GUIDE.md](../operations/MONITORING_GUIDE.md) for alert thresholds and dashboard configuration.
