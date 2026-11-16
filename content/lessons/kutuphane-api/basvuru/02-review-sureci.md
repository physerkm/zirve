---
title: Review süreci
summary: Kontrol isterken ne yazacağın ve kontrol sırasında nelere bakıldığı.
minutes: 3
level: beginner
---
## 16.1 Benden kontrol isterken

Aşağıdaki gibi kısa mesajlar yeterli:

- “Faz 1 bitti, kontrol et.”
- “Faz 2'de sadece Loans klasörüne bak.”
- “Bu derleme hatasını anlamadım; kavramı açıkla ama kod yazma.”
- “ValidationDecorator'ı nasıl kaydedeceğimi bulamadım, bir ipucu ver.”
- “Bulguları düzelttim, tekrar kontrol et.”

## 16.2 Kontrol sırasında yapacaklarım

1. `dotnet build` ve `dotnet test` çalıştırıp sonuçları raporlamak.
2. O fazda değişen dosyaları okumak (git geçmişinden).
3. Fazın kabul kriterlerini ve “Review'da bakacaklarım” listesini tek tek kontrol etmek.
4. İş kurallarını (BR-xx) koda karşı doğrulamak.
5. Bulguları seviyelerine göre sıralayıp yazmak: dosya:satır, sorun, neden önemli, ipucu.

> **Bilgi:** Senin açıkça istemen dışında kodunu değiştirmem, dosya oluşturmam veya düzeltilmiş kod göstermem. Bir kavramı açıklarken genel bir örneğe ihtiyaç duyarsan, bu projeyle ilgisi olmayan bir alandan örnek isteyebilirsin.
