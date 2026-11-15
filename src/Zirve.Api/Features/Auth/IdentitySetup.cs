using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Zirve.Api.Data;
using Zirve.Api.Data.Entities;
using Zirve.Api.Infrastructure;

namespace Zirve.Api.Features.Auth;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    /// <summary>
    /// Oturum ve CSRF çerezlerinin Secure bayrağı. Üretimde her zaman true olmalıdır; yalnızca
    /// HTTP üzerinden yapılan yerel geliştirmede false yapılır.
    /// </summary>
    public bool RequireSecureCookies { get; set; } = true;

    public int SessionDays { get; set; } = 14;
}

/// <summary>Oturum çerezine görünen adı da ekler; böylece her istekte kullanıcı tablosuna gidilmez.</summary>
public sealed class AppUserClaimsPrincipalFactory(UserManager<AppUser> userManager, IOptions<IdentityOptions> options)
    : UserClaimsPrincipalFactory<AppUser>(userManager, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(AppUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        identity.AddClaim(new Claim(ZirveClaims.DisplayName, user.DisplayName));
        return identity;
    }
}

public sealed class TurkishIdentityErrorDescriber : IdentityErrorDescriber
{
    public override IdentityError DuplicateEmail(string email) =>
        new() { Code = nameof(DuplicateEmail), Description = "Bu e-posta adresiyle kayıtlı bir hesap zaten var." };

    public override IdentityError DuplicateUserName(string userName) =>
        new() { Code = nameof(DuplicateUserName), Description = "Bu e-posta adresiyle kayıtlı bir hesap zaten var." };

    public override IdentityError InvalidEmail(string? email) =>
        new() { Code = nameof(InvalidEmail), Description = "Geçerli bir e-posta adresi girin." };

    public override IdentityError InvalidUserName(string? userName) =>
        new() { Code = nameof(InvalidUserName), Description = "Geçerli bir e-posta adresi girin." };

    public override IdentityError PasswordTooShort(int length) =>
        new() { Code = nameof(PasswordTooShort), Description = $"Parola en az {length} karakter olmalı." };

    public override IdentityError PasswordRequiresUniqueChars(int uniqueChars) =>
        new() { Code = nameof(PasswordRequiresUniqueChars), Description = $"Parola en az {uniqueChars} farklı karakter içermeli." };

    public override IdentityError PasswordRequiresDigit() =>
        new() { Code = nameof(PasswordRequiresDigit), Description = "Parola en az bir rakam içermeli." };

    public override IdentityError PasswordRequiresLower() =>
        new() { Code = nameof(PasswordRequiresLower), Description = "Parola en az bir küçük harf içermeli." };

    public override IdentityError PasswordRequiresUpper() =>
        new() { Code = nameof(PasswordRequiresUpper), Description = "Parola en az bir büyük harf içermeli." };

    public override IdentityError PasswordRequiresNonAlphanumeric() =>
        new() { Code = nameof(PasswordRequiresNonAlphanumeric), Description = "Parola en az bir özel karakter içermeli." };

    public override IdentityError DefaultError() =>
        new() { Code = nameof(DefaultError), Description = "Bilinmeyen bir hata oluştu." };
}

public static class IdentitySetup
{
    public static IServiceCollection AddZirveIdentity(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<AuthOptions>().BindConfiguration(AuthOptions.SectionName);

        var auth = configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>() ?? new AuthOptions();
        var securePolicy = auth.RequireSecureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;

        services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();
        services.AddAuthorization();

        services
            .AddIdentityCore<AppUser>(identity =>
            {
                identity.User.RequireUniqueEmail = true;

                // NIST SP 800-63B: uzunluk, karmaşıklık kurallarından daha değerlidir.
                identity.Password.RequiredLength = 8;
                identity.Password.RequiredUniqueChars = 4;
                identity.Password.RequireDigit = false;
                identity.Password.RequireLowercase = false;
                identity.Password.RequireUppercase = false;
                identity.Password.RequireNonAlphanumeric = false;

                identity.Lockout.AllowedForNewUsers = true;
                identity.Lockout.MaxFailedAccessAttempts = 5;
                identity.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager()
            .AddClaimsPrincipalFactory<AppUserClaimsPrincipalFactory>()
            .AddErrorDescriber<TurkishIdentityErrorDescriber>()
            .AddDefaultTokenProviders();

        services.ConfigureApplicationCookie(cookie =>
        {
            cookie.Cookie.Name = "zirve.session";
            cookie.Cookie.HttpOnly = true;
            cookie.Cookie.SameSite = SameSiteMode.Strict;
            cookie.Cookie.SecurePolicy = securePolicy;
            cookie.ExpireTimeSpan = TimeSpan.FromDays(auth.SessionDays);
            cookie.SlidingExpiration = true;

            // Bu bir API: giriş sayfasına yönlendirmek yerine durum kodu döndür.
            cookie.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            cookie.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });

        services.AddAntiforgery(antiforgery =>
        {
            antiforgery.HeaderName = SecurityMiddlewareExtensions.CsrfHeaderName;
            antiforgery.Cookie.Name = "zirve.csrf";
            antiforgery.Cookie.HttpOnly = true;
            antiforgery.Cookie.SameSite = SameSiteMode.Strict;
            antiforgery.Cookie.SecurePolicy = securePolicy;
        });

        return services;
    }
}
