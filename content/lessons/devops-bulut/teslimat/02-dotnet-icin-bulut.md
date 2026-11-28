---
title: .NET Geliştiricisi için Bulut (Azure ve AWS)
summary: IaaS, PaaS ve serverless farkı, uygulama barındırma seçenekleri, veri ve mesajlaşma servisleri, kimlik ve gizli bilgi yönetimi, izleme, Azure ve AWS servis karşılıkları tablosu, altyapıyı kodla yönetmek ve maliyet.
minutes: 22
level: intermediate
---

18 ilanın 9'unda bulut deneyimi istenir ve .NET dünyasında bu çoğunlukla **Azure**'dur. Microsoft'un bütün ilanları Azure ister, Avrupa'daki ilanların çoğu "Azure tercih sebebi" der. Türkiye'deki ilanlar Azure ya da AWS'yi artı sayar. Bu ders bir .NET backend geliştiricisinin bilmesi gereken servisleri ve hangisinin ne zaman seçileceğini anlatır. Konsol tıklamaları değil, kavramlar ve ödünleşimler önemlidir.

## Sorumluluk paylaşımı

| Model | Siz yönetirsiniz | Sağlayıcı yönetir | Örnek |
| --- | --- | --- | --- |
| **IaaS** | İşletim sistemi, çalışma zamanı, uygulama | Donanım, ağ, sanallaştırma | Sanal makine (Azure VM, EC2) |
| **CaaS** | Konteyner imajı, ölçekleme kuralları | Orkestrasyon (kısmen ya da tamamen) | AKS, EKS, Azure Container Apps, ECS/Fargate |
| **PaaS** | Uygulama kodu ve yapılandırma | İşletim sistemi, yamalar, ölçekleme altyapısı | Azure App Service, Elastic Beanstalk |
| **Serverless (FaaS)** | Yalnızca fonksiyon | Her şey. Kullanım başına ödeme | Azure Functions, AWS Lambda |

Tabloda yukarı çıktıkça (IaaS'a doğru) kontrol artar, operasyon yükü de artar. Aşağı indikçe (serverless'a doğru) hız ve kolaylık artar, esneklik azalır.

## Uygulama barındırma

| İhtiyaç | Azure | AWS |
| --- | --- | --- |
| Web API'yi en kolay yoldan yayınlamak | App Service | Elastic Beanstalk, App Runner |
| Konteyner, Kubernetes bilmeden | **Container Apps** | ECS + Fargate, App Runner |
| Tam Kubernetes | AKS | EKS |
| Olay tetiklemeli, kısa süreli işler | Functions | Lambda |
| Sanal makine | Virtual Machines | EC2 |

**Serverless ne zaman?** Düzensiz ve patlamalı yük (gece toplu iş, webhook), olay tetiklemeli işler (kuyruğa mesaj geldi, dosya yüklendi). **Ne zaman değil?** Sürekli yüksek trafik (kalıcı örnek daha ucuzdur), uzun süren işler, soğuk başlangıç gecikmesine (cold start) hassas API'ler.

Yeni .NET servisleri için Azure'da makul varsayılan **Container Apps**'tir: konteyner tabanlı, sıfıra ölçeklenebilir, KEDA ile kuyruk uzunluğuna göre ölçeklenir ve Kubernetes'in karmaşıklığını gizler.

## Veri

| İhtiyaç | Azure | AWS |
| --- | --- | --- |
| Yönetilen SQL Server | Azure SQL Database | RDS for SQL Server |
| Yönetilen PostgreSQL | Azure Database for PostgreSQL | RDS / Aurora PostgreSQL |
| Global dağıtık NoSQL | **Cosmos DB** | DynamoDB |
| Önbellek (Redis uyumlu) | Azure Managed Redis | ElastiCache, MemoryDB |
| Dosya ve nesne depolama | Blob Storage | **S3** |
| Arama | Azure AI Search | OpenSearch Service |

Yönetilen veritabanlarında yedekleme, yama, yüksek erişilebilirlik ve kopyalar sağlayıcıdadır. Siz bağlantı sınırları, ölçek seçimi (vCore ya da DTU), indeksler ve sorgu performansıyla ilgilenirsiniz.

**Cosmos DB** mülakatta sık sorulur: bölüm anahtarı (partition key) seçimi performansı belirler. Yanlış anahtar sıcak bölüme (hot partition) yol açar. Beş tutarlılık seviyesi sunar (strong, bounded staleness, session, consistent prefix, eventual). Maliyet **istek birimi (RU)** ile ölçülür.

## Mesajlaşma ve entegrasyon

| İhtiyaç | Azure | AWS |
| --- | --- | --- |
| Kurumsal kuyruk ve yayın-abone | **Service Bus** | SQS + SNS |
| Yüksek hacimli olay akışı | Event Hubs | Kinesis, MSK (Kafka) |
| Olay yönlendirme (kaynak olaylarına tepki) | Event Grid | EventBridge |
| Basit ve ucuz kuyruk | Storage Queues | SQS |
| İş akışı orkestrasyonu | Durable Functions, Logic Apps | Step Functions |

## Kimlik ve gizli bilgiler

- **Microsoft Entra ID** (eski adı Azure AD) Azure'daki kimlik sağlayıcıdır. Kullanıcı girişi (OIDC) ve uygulama kimlikleri buradadır. AWS'de karşılığı **IAM** ve kullanıcılar için Cognito ya da IAM Identity Center'dır.
- **Managed Identity** (AWS'de IAM Role): uygulamanın bulut kaynaklarına **parolasız** erişmesini sağlar. Kodda bağlantı dizgisi ya da anahtar yoktur:

```csharp
var credential = new DefaultAzureCredential();   // yerelde: geliştiricinin oturumu; bulutta: Managed Identity

var blobs = new BlobServiceClient(new Uri("https://ordersdocs.blob.core.windows.net"), credential);
builder.Configuration.AddAzureKeyVault(new Uri("https://orders-kv.vault.azure.net/"), credential);
```

- **Key Vault** (AWS'de Secrets Manager ve KMS): gizli bilgiler, şifreleme anahtarları ve sertifikalar.
- **En az yetki:** her uygulama kimliğine yalnızca ihtiyacı olan rol verilir ("Storage Blob Data Reader", tüm aboneliğe "Contributor" değil).

## İzleme

| İhtiyaç | Azure | AWS |
| --- | --- | --- |
| Uygulama izleme (APM), dağıtık iz | **Application Insights** (Azure Monitor) | X-Ray, CloudWatch Application Signals |
| Log toplama ve sorgulama | Log Analytics (KQL dili) | CloudWatch Logs (Logs Insights) |
| Metrik ve alarm | Azure Monitor | CloudWatch |

Her ikisi de OpenTelemetry'yi destekler. Uygulamayı OpenTelemetry ile enstrümante etmek sağlayıcı değiştirmeyi kolaylaştırır. Azure tarafında `Azure.Monitor.OpenTelemetry.AspNetCore` paketiyle tek satırda bağlanılır: `builder.Services.AddOpenTelemetry().UseAzureMonitor();`.

## Ağ ve dış kapı

| İhtiyaç | Azure | AWS |
| --- | --- | --- |
| Özel ağ | Virtual Network (VNet) | VPC |
| API yönetimi, anahtar, kota | API Management | API Gateway |
| Global giriş, CDN, WAF | Front Door | CloudFront + WAF |
| Bölgesel yük dengeleyici (L7) | Application Gateway | Application Load Balancer |
| Servise özel ağ erişimi | Private Endpoint | PrivateLink |

İyi uygulama: veritabanı ve önbellek internete açık olmaz. Uygulamalar onlara özel ağ uç noktaları üzerinden ulaşır.

## Altyapıyı kodla yönetmek (IaC)

Kaynakları portalda tıklayarak oluşturmak tekrarlanamaz ve denetlenemez. IaC ile altyapı kod olarak sürümlenir, review edilir ve hatta uygulanır.

| Araç | Not |
| --- | --- |
| **Terraform / OpenTofu** | Çoklu bulut, en yaygın. Durum (state) dosyası yönetimi gerekir |
| **Bicep** | Azure'a özel, ARM şablonlarının okunur hali |
| **AWS CloudFormation / CDK** | AWS'ye özel. CDK ile C# dahil gerçek dillerde altyapı yazılır |
| **Pulumi** | Gerçek dillerle (C# dahil) çoklu bulut |
| **.NET Aspire + azd** | Yerel geliştirme düzenini tanımlar ve Azure'a dağıtım için altyapıyı üretir |

```hcl
resource "azurerm_container_app" "orders" {
  name                         = "orders-api"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"

  template {
    min_replicas = 1
    max_replicas = 10
    container {
      name   = "api"
      image  = "acmeregistry.azurecr.io/orders-api:${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"
    }
  }
}
```

## Dayanıklılık ve maliyet

- **Bölge ve erişilebilirlik alanı (availability zone):** bir bölge içinde fiziksel olarak ayrı veri merkezleri. Kritik servisler birden fazla alana yayılır. Felaket kurtarma için ikinci bir bölge planlanır. **RTO** (ne kadar sürede geri dönülür) ve **RPO** (ne kadar veri kaybı kabul edilir) hedefleri mimariyi belirler.
- **Maliyet bir tasarım girdisidir:** doğru boyutlandırma, kullanılmayan kaynakları kapatma, sürekli yük için rezerve kapasite, düzensiz yük için serverless, veri çıkış ücretleri (egress) ve log hacmi. Bütçe uyarıları kurulmalıdır.
- **Sertifikalar:** Azure ve AWS'nin geliştirici ve mimar sertifikaları birçok ilanda tercih sebebi olarak geçer. Sınav kodları zaman zaman değiştiği için güncel listeyi Microsoft Learn ve AWS Training sayfalarından kontrol edin.

## Mülakatta sorulur

- **"App Service, Container Apps, AKS, Functions arasında nasıl seçersin?"** Ekip yetkinliği, kontrol ihtiyacı, yük profili ve maliyete göre. Kubernetes uzmanlığı yoksa Container Apps ya da App Service. Olay tetiklemeli kısa işler için Functions.
- **"Uygulamanın Key Vault'a erişmesi için parolayı nerede saklarsın?"** Saklamam. Managed Identity ve `DefaultAzureCredential` kullanırım.
- **"Serverless'ın dezavantajları?"** Soğuk başlangıç, çalışma süresi sınırları, sürekli yükte yüksek maliyet, yerelde hata ayıklama zorluğu, sağlayıcıya bağımlılık.
- **"Altyapıyı neden kodla yönetirsin?"** Tekrarlanabilirlik, review, sürüm geçmişi, ortamlar arası tutarlılık ve felakette yeniden kurulum.
- **"Cosmos DB'de partition key nasıl seçilir?"** Yüksek kardinaliteli, yükü eşit dağıtan ve sık sorgularda filtre olarak kullanılan bir alan.

## Özet

- IaaS'tan serverless'a giderken kontrol azalır, hız ve kolaylık artar.
- Azure'da yeni konteyner servisleri için Container Apps makul varsayılandır. AKS tam kontrol, Functions olay tetiklemeli iş içindir.
- Veri, mesajlaşma, kimlik ve izleme servislerinin Azure ve AWS karşılıklarını eşleştirebilmek mülakatta yeterli derinliktir.
- Parolasız kimlik (Managed Identity, IAM Role) ve en az yetki temel güvenlik ilkesidir.
- Altyapı kodla yönetilir. Maliyet, RTO ve RPO tasarımın girdileridir.
