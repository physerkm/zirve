using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;
using Zirve.Api.Data;
using Zirve.Api.Infrastructure;
using Zirve.Runner.Execution;
using Zirve.Shared;
using Zirve.Shared.Execution;
using Zirve.Tests.Runner;

namespace Zirve.Tests.Api;

/// <summary>
/// API'yi bellekte, gerçek bir PostgreSQL veritabanına karşı ayağa kaldırır. Her test sınıfı için
/// tek kullanımlık bir veritabanı oluşturulur ve sonunda silinir. Kod çalıştırma istekleri HTTP
/// yerine doğrudan gerçek Runner servisine (süreç içi) gider.
/// <para>
/// Sunucu adresi <c>ZIRVE_TEST_DB</c> ortam değişkeninden okunur; ayarlı değilse yerel geliştirme
/// veritabanı (<c>npm run db</c>) kullanılır. Sunucuya ulaşılamazsa testler atlanır.
/// </para>
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<AppDbContext>, IAsyncLifetime
{
    private const string DefaultServer = "Host=localhost;Port=5433;Username=zirve;Password=zirve_dev_password";

    private readonly string _databaseName = $"zirve_test_{Guid.NewGuid():N}";
    private readonly RunnerFixture _runner = new();

    public bool DatabaseAvailable { get; private set; }

    private static string DatabaseServer => Environment.GetEnvironmentVariable("ZIRVE_TEST_DB") ?? DefaultServer;

    private string ConnectionString => new NpgsqlConnectionStringBuilder(DatabaseServer) { Database = _databaseName, Pooling = false }.ConnectionString;

    private static string AdminConnectionString => new NpgsqlConnectionStringBuilder(DatabaseServer) { Database = "postgres", Pooling = false }.ConnectionString;

    public async ValueTask InitializeAsync()
    {
        try
        {
            await using var connection = new NpgsqlConnection(AdminConnectionString);
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"CREATE DATABASE \"{_databaseName}\" ENCODING 'UTF8' TEMPLATE template0", connection);
            await command.ExecuteNonQueryAsync();
            DatabaseAvailable = true;
        }
        catch (Exception ex) when (ex is NpgsqlException or System.Net.Sockets.SocketException or TimeoutException)
        {
            DatabaseAvailable = false;
        }
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();

        if (!DatabaseAvailable)
        {
            return;
        }

        await using var connection = new NpgsqlConnection(AdminConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"DROP DATABASE IF EXISTS \"{_databaseName}\" WITH (FORCE)", connection);
        await command.ExecuteNonQueryAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", ConnectionString);
        builder.UseSetting("Database:ApplyMigrationsOnStartup", "true");
        builder.UseSetting("Auth:RequireSecureCookies", "false");
        builder.UseSetting("Runner:BaseUrl", "http://runner.invalid");
        builder.UseSetting("RateLimiting:GlobalPerMinute", "100000");
        builder.UseSetting("RateLimiting:AuthPerMinute", "100000");
        builder.UseSetting("RateLimiting:ExecutePerMinute", "100000");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ICodeRunner>();
            services.AddSingleton<ICodeRunner>(new InProcessCodeRunner(_runner.Service));
        });
    }

    /// <summary>Çerezleri tutan ve CSRF belirtecini kendiliğinden ekleyen bir istemci oturumu açar.</summary>
    public async Task<ApiSession> CreateSessionAsync()
    {
        Assert.SkipUnless(DatabaseAvailable, "PostgreSQL'e ulaşılamadı (yerelde: npm run db; CI'da: ZIRVE_TEST_DB).");

        var client = CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true, AllowAutoRedirect = false });
        var session = new ApiSession(client);
        await session.RefreshAsync();
        return session;
    }

    private sealed class InProcessCodeRunner(ExecutionService service) : ICodeRunner
    {
        public Task<ExecutionResult> ExecuteAsync(ExecutionRequest request, CancellationToken cancellationToken) =>
            service.ExecuteAsync(request, cancellationToken);
    }
}

/// <summary>Tarayıcıdaki SPA'nın davranışını taklit eden test istemcisi.</summary>
public sealed class ApiSession(HttpClient client)
{
    private string _csrfToken = string.Empty;

    public HttpClient Client { get; } = client;

    public async Task<JsonElement> RefreshAsync()
    {
        var session = await GetAsync("/api/auth/session");
        _csrfToken = session.GetProperty("csrfToken").GetString()!;
        return session;
    }

    public async Task<JsonElement> GetAsync(string path)
    {
        using var response = await Client.GetAsync(path, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        return await ReadAsync(response);
    }

    public Task<HttpResponseMessage> GetRawAsync(string path) => Client.GetAsync(path, TestContext.Current.CancellationToken);

    public Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, object? body = null, bool withCsrf = true)
    {
        var request = new HttpRequestMessage(method, path);

        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: ZirveJson.Options);
        }

        if (withCsrf)
        {
            request.Headers.Add("X-CSRF-TOKEN", _csrfToken);
        }

        return Client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    public async Task<JsonElement> PostAsync(string path, object? body = null)
    {
        using var response = await SendAsync(HttpMethod.Post, path, body);
        var payload = await ReadAsync(response);
        Assert.True(response.IsSuccessStatusCode, $"POST {path} -> {(int)response.StatusCode}: {payload}");
        return payload;
    }

    public async Task<JsonElement> RegisterAsync(string? email = null, string displayName = "Test Kullanıcısı")
    {
        email ??= $"user-{Guid.NewGuid():N}@example.com";
        var session = await PostAsync("/api/auth/register", new { email, password = "doğru at pil zımba", displayName });
        _csrfToken = session.GetProperty("csrfToken").GetString()!;
        return session;
    }

    public static async Task<JsonElement> ReadAsync(HttpResponseMessage response)
    {
        var text = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        if (string.IsNullOrWhiteSpace(text))
        {
            return default;
        }

        using var document = JsonDocument.Parse(text);
        return document.RootElement.Clone();
    }
}
