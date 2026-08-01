# ============================================================================
# Backend API Dockerfile - Multi-stage build for optimal size
# AI Fullstack Accelerator - ASP.NET Core 8.0
# ============================================================================

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0@sha256:cb9d975bf57fd1b0915858d1db1184bea20f7f746f0536323fcab49673144e8c AS build
WORKDIR /src

# Copy project files
COPY ["src/Accelerator.Api/Accelerator.Api.csproj", "src/Accelerator.Api/"]
COPY ["src/Accelerator.Core/Accelerator.Core.csproj", "src/Accelerator.Core/"]
COPY ["src/Accelerator.Data/Accelerator.Data.csproj", "src/Accelerator.Data/"]
COPY ["src/Accelerator.Infrastructure/Accelerator.Infrastructure.csproj", "src/Accelerator.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/Accelerator.Api/Accelerator.Api.csproj"

# Copy all source files
COPY . .

# Build and publish
WORKDIR "/src/src/Accelerator.Api"
RUN dotnet build "Accelerator.Api.csproj" -c Release -o /app/build
RUN dotnet publish "Accelerator.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime (Alpine — smaller image, BusyBox wget for healthcheck)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine@sha256:354c2fcfb3c23abc60d98f0380cdb403fba844a62a123b6343a8c9611209995c AS runtime
WORKDIR /app

# Create non-root user (Alpine syntax)
RUN addgroup -S appuser && adduser -S appuser -G appuser

# Copy published app from build stage
COPY --from=build /app/publish .

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (Using 8080 for non-root user compatibility)
EXPOSE 8080

# Health check (BusyBox wget — pre-installed in Alpine, no curl/apt-get needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Start the application
ENTRYPOINT ["dotnet", "Accelerator.Api.dll"]
