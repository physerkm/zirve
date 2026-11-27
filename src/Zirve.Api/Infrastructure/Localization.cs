using System.Globalization;
using Microsoft.AspNetCore.Localization;

namespace Zirve.Api.Infrastructure;

/// <summary>
/// Sitenin iki dili: Türkçe (varsayılan) ve İngilizce. İstemci dili <c>Accept-Language</c> başlığıyla bildirir;
/// yalnızca arayüz kültürü (<see cref="CultureInfo.CurrentUICulture"/>) değişir. Biçimlendirme ve karşılaştırma
/// kültürü her istekte değişmez kültürdür, böylece sunucunun davranışı dile göre değişmez.
/// </summary>
public static class Localization
{
    public static readonly CultureInfo Turkish = CultureInfo.GetCultureInfo("tr");

    public static readonly CultureInfo English = CultureInfo.GetCultureInfo("en");

    /// <summary>İsteğin dili İngilizce mi? Değilse Türkçedir.</summary>
    public static bool IsEnglish => CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "en";

    /// <summary>
    /// İsteğin dili, HttpContext üzerinden. Hata işleyici gibi dil ara katmanının dışında (ondan önce) çalışan
    /// kod için gerekir: oraya dönüldüğünde <see cref="CultureInfo.CurrentUICulture"/> artık eski değerindedir.
    /// </summary>
    public static bool IsEnglishRequest(HttpContext http) =>
        (http.Features.Get<IRequestCultureFeature>()?.RequestCulture.UICulture ?? CultureInfo.CurrentUICulture)
            .TwoLetterISOLanguageName == "en";

    /// <summary>İsteğin diline göre iki metinden birini seçer.</summary>
    public static string Text(string turkish, string english) => IsEnglish ? english : turkish;

    /// <summary>İsteğin dil kodu ("tr" ya da "en").</summary>
    public static string LanguageCode => IsEnglish ? "en" : "tr";

    public static IApplicationBuilder UseZirveLocalization(this IApplicationBuilder app) =>
        app.UseRequestLocalization(options =>
        {
            options.DefaultRequestCulture = new RequestCulture(CultureInfo.InvariantCulture, Turkish);
            options.SupportedCultures = [CultureInfo.InvariantCulture];
            options.SupportedUICultures = [Turkish, English];
            options.FallBackToParentUICultures = true;
            options.RequestCultureProviders = [new AcceptLanguageHeaderRequestCultureProvider()];
        });
}
