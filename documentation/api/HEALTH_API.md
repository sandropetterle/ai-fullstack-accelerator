# Health API Reference

**Last Updated:** 2026-03-24
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

Readiness check. Includes an EF Core `DbContext` check — confirms the database connection is healthy before marking the container as ready to serve traffic.

### Example Response (healthy)

```json
200 OK
Content-Type: application/json

{
  "status": "Healthy",
  "results": {
    "accelerator-api-db": {
      "status": "Healthy",
      "description": null,
      "data": {}
    }
  }
}
```

### Example Response (unhealthy)

```json
503 Service Unavailable
Content-Type: application/json

{
  "status": "Unhealthy",
  "results": {
    "accelerator-api-db": {
      "status": "Unhealthy",
      "description": "An exception was thrown while checking health.",
      "data": {}
    }
  }
}
```

### Health Check Configuration

Defined in `Program.cs`:

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");
```

See [MONITORING_GUIDE.md](../operations/MONITORING_GUIDE.md) for alert thresholds and dashboard configuration.
