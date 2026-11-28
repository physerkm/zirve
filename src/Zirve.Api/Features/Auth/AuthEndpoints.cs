using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Zirve.Api.Data.Entities;
using Zirve.Api.Infrastructure;

namespace Zirve.Api.Features.Auth;

public sealed record UserDto(Guid Id, string Email, string DisplayName);

/// <summary>Oturum durumu ve bu oturum için geçerli CSRF belirteci.</summary>
public sealed record SessionResponse(UserDto? User, string CsrfToken);

public sealed class RegisterRequest
{
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.EmailRequired))]
    [EmailAddress(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.InvalidEmail))]
    [StringLength(254, ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.EmailTooLong))]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordRequired))]
    [StringLength(128, MinimumLength = 8, ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordLength))]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.DisplayNameRequired))]
    [StringLength(40, MinimumLength = 2, ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.DisplayNameLength))]
    public string DisplayName { get; set; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.EmailRequired))]
    [StringLength(254, ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.EmailTooLong))]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordRequired))]
    [StringLength(128, ErrorMessageResourceType = typeof(ValidationMessages), ErrorMessageResourceName = nameof(ValidationMessages.PasswordTooLong))]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = true;
}

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/auth").WithTags("Kimlik");

        group.MapGet("/session", GetSession)
            .WithSummary("Oturum durumunu ve CSRF belirtecini döndürür.");

        group.MapPost("/register", RegisterAsync)
            .RequireRateLimiting(RateLimitPolicies.Auth)
            .WithSummary("Yeni hesap oluşturur ve oturum açar.");

        group.MapPost("/login", LoginAsync)
            .RequireRateLimiting(RateLimitPolicies.Auth)
            .WithSummary("E-posta ve parola ile oturum açar.");

        group.MapPost("/logout", LogoutAsync)
            .WithSummary("Oturumu kapatır.");

        return api;
    }

    private static SessionResponse GetSession(HttpContext http, IAntiforgery antiforgery) => IssueSession(http, antiforgery);

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        UserManager<AppUser> users,
        SignInManager<AppUser> signIn,
        IAntiforgery antiforgery,
        TimeProvider timeProvider,
        HttpContext http)
    {
        var email = request.Email.Trim();
        var user = new AppUser
        {
            UserName = email,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            CreatedAt = timeProvider.GetUtcNow(),
        };

        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return Results.ValidationProblem(ToValidationErrors(result));
        }

        await signIn.SignInAsync(user, isPersistent: true);
        http.User = await signIn.CreateUserPrincipalAsync(user);
        return Results.Ok(IssueSession(http, antiforgery));
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        UserManager<AppUser> users,
        SignInManager<AppUser> signIn,
        IAntiforgery antiforgery,
        HttpContext http)
    {
        // Hesabın var olup olmadığını sızdırmamak için her başarısızlıkta aynı yanıt verilir.
        var invalidCredentials = Localization.Text("E-posta ya da parola hatalı.", "Incorrect email or password.");

        var user = await users.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: invalidCredentials);
        }

        var result = await signIn.PasswordSignInAsync(user, request.Password, request.RememberMe, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status429TooManyRequests,
                title: Localization.Text(
                    "Çok fazla hatalı deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.",
                    "Too many failed attempts. Please try again in a few minutes."));
        }

        if (!result.Succeeded)
        {
            return Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: invalidCredentials);
        }

        http.User = await signIn.CreateUserPrincipalAsync(user);
        return Results.Ok(IssueSession(http, antiforgery));
    }

    private static async Task<IResult> LogoutAsync(SignInManager<AppUser> signIn, IAntiforgery antiforgery, HttpContext http)
    {
        await signIn.SignOutAsync();
        http.User = new ClaimsPrincipal(new ClaimsIdentity());
        return Results.Ok(IssueSession(http, antiforgery));
    }

    /// <summary>
    /// CSRF belirteci kullanıcı kimliğine bağlıdır; bu yüzden giriş/çıkıştan hemen sonra, yanıtla birlikte
    /// yeni kimlik için yeni bir belirteç üretilir.
    /// </summary>
    private static SessionResponse IssueSession(HttpContext http, IAntiforgery antiforgery)
    {
        var tokens = antiforgery.GetAndStoreTokens(http);
        return new SessionResponse(ToUserDto(http.User), tokens.RequestToken!);
    }

    private static UserDto? ToUserDto(ClaimsPrincipal principal)
    {
        if (principal.GetUserId() is not { } id)
        {
            return null;
        }

        return new UserDto(
            id,
            principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
            principal.FindFirstValue(ZirveClaims.DisplayName) ?? string.Empty);
    }

    private static Dictionary<string, string[]> ToValidationErrors(IdentityResult result) =>
        result.Errors
            .GroupBy(error => error.Code switch
            {
                var code when code.StartsWith("Password", StringComparison.Ordinal) => nameof(RegisterRequest.Password),
                var code when code.Contains("Email", StringComparison.Ordinal) || code.Contains("UserName", StringComparison.Ordinal) => nameof(RegisterRequest.Email),
                _ => "General",
            })
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).Distinct().ToArray());
}
