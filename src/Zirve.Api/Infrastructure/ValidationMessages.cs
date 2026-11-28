namespace Zirve.Api.Infrastructure;

/// <summary>
/// Doğrulama iletileri. Öznitelikler sabit metin aldığı için iletiler
/// <c>ErrorMessageResourceType = typeof(ValidationMessages)</c> ile buradan okunur; her özellik isteğin
/// diline göre metin döndürür. Biçim yer tutucuları ({1}, {2}) <see cref="System.ComponentModel.DataAnnotations"/>
/// özniteliklerinin kendi değerleriyle doldurulur.
/// </summary>
public static class ValidationMessages
{
    public static string EmailRequired => Localization.Text("E-posta zorunlu.", "Email is required.");

    public static string InvalidEmail => Localization.Text("Geçerli bir e-posta adresi girin.", "Enter a valid email address.");

    public static string EmailTooLong => Localization.Text("E-posta en fazla 254 karakter olabilir.", "Email can be at most 254 characters.");

    public static string PasswordRequired => Localization.Text("Parola zorunlu.", "Password is required.");

    public static string PasswordLength => Localization.Text("Parola 8 ile 128 karakter arasında olmalı.", "Password must be between 8 and 128 characters.");

    public static string PasswordTooLong => Localization.Text("Parola en fazla 128 karakter olabilir.", "Password can be at most 128 characters.");

    public static string LanguageTooLong => Localization.Text("Dil en fazla 20 karakter olabilir.", "Language can be at most 20 characters.");

    public static string DisplayNameRequired => Localization.Text("Görünen ad zorunlu.", "Display name is required.");

    public static string DisplayNameLength => Localization.Text("Görünen ad 2 ile 40 karakter arasında olmalı.", "Display name must be between 2 and 40 characters.");

    public static string LanguageRequired => Localization.Text("Dil zorunlu.", "Language is required.");

    public static string CodeRequired => Localization.Text("Kod boş olamaz.", "Code can't be empty.");

    public static string CodeTooLong => Localization.Text("Kod en fazla 50.000 karakter olabilir.", "Code can be at most 50,000 characters.");

    public static string InvalidDuration => Localization.Text("Süre geçersiz.", "Invalid duration.");
}
