using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Zirve.Api.Content;
using Zirve.Api.Data;
using Zirve.Api.Features.Auth;
using Zirve.Api.Features.Catalog;
using Zirve.Api.Features.Dashboard;
using Zirve.Api.Features.Playground;
using Zirve.Api.Features.Problems;
using Zirve.Api.Features.Quizzes;
using Zirve.Api.Features.Search;
using Zirve.Api.Infrastructure;
using Zirve.Shared;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:Default ayarlanmamış (ortam değişkeni: ConnectionStrings__Default).");
}

builder.Services.AddDbContext<AppDbContext>(options => options
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention());

builder.Services.AddOptions<DatabaseOptions>().BindConfiguration(DatabaseOptions.SectionName);
builder.Services.AddOptions<ContentOptions>().BindConfiguration(ContentOptions.SectionName);
builder.Services.AddScoped<ContentSynchronizer>();
builder.Services.AddScoped<DatabaseInitializer>();
builder.Services.AddScoped<ProblemJudge>();
builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddZirveIdentity(builder.Configuration);

// Oturum çerezleri ve CSRF belirteçleri Data Protection anahtarlarıyla şifrelenir. Anahtarlar kalıcı bir
// yerde durmazsa her yeniden başlatmada bütün oturumlar düşer ve birden fazla örnek birbirinin çerezini okuyamaz.
var keysPath = builder.Configuration["DataProtection:KeysPath"];
if (!string.IsNullOrWhiteSpace(keysPath))
{
    builder.Services.AddDataProtection()
        .SetApplicationName("zirve")
        .PersistKeysToFileSystem(new DirectoryInfo(keysPath));
}

// Ters vekil (nginx) arkasında gerçek istemci adresi ve şema X-Forwarded-* başlıklarından okunur.
// Yalnızca API doğrudan internete açık DEĞİLSE etkinleştirin; aksi halde bu başlıklar taklit edilebilir.
var behindProxy = builder.Configuration.GetValue<bool>("ForwardedHeaders:Enabled");
if (behindProxy)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();

        // Varsayılan 1: yalnızca nginx önde. nginx'in önünde bir yük dengeleyici daha varsa 2 yapın; yoksa
        // bütün istekler dengeleyicinin adresinden gelmiş görünür ve IP başına sınırlar herkes için ortak olur.
        options.ForwardLimit = builder.Configuration.GetValue<int?>("ForwardedHeaders:ForwardLimit") ?? 1;
    });
}
builder.Services.AddCodeRunner();
builder.Services.AddZirveRateLimiting();

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddValidation();
builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(options => ZirveJson.Apply(options.SerializerOptions));
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);

var app = builder.Build();

if (behindProxy)
{
    app.UseForwardedHeaders();
}

app.UseExceptionHandler();
app.UseStatusCodePages();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseSecurityHeaders();
app.UseZirveLocalization();
app.UseAuthentication();
// Kimlik doğrulamadan SONRA: kod çalıştırma sınırı kullanıcı başınadır ve kullanıcı ancak burada bilinir.
app.UseRateLimiter();
app.UseAuthorization();
app.UseCsrfProtection();

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

var api = app.MapGroup("/api");
api.MapAuthEndpoints();
api.MapCatalogEndpoints();
api.MapQuizEndpoints();
api.MapProblemEndpoints();
api.MapPlaygroundEndpoints();
api.MapDashboardEndpoints();
api.MapSearchEndpoints();

await using (var scope = app.Services.CreateAsyncScope())
{
    await scope.ServiceProvider.GetRequiredService<DatabaseInitializer>().InitializeAsync(app.Lifetime.ApplicationStopping);
}

await app.RunAsync();
