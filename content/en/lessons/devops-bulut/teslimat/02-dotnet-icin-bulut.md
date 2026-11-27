---
title: Cloud for .NET Developers (Azure and AWS)
summary: The difference between IaaS, PaaS, and serverless, application hosting options, data and messaging services, identity and secret management, monitoring, a table of equivalent Azure and AWS services, managing infrastructure as code, and cost.
---

9 of the 18 job postings ask for cloud experience, and in the .NET world that usually means **Azure**. All of Microsoft's postings ask for Azure, and most postings in Europe say "Azure is a plus." Postings in Turkey count Azure or AWS as a plus. This lesson covers the services a .NET backend developer should know and when to choose each one. What matters is the concepts and the trade-offs, not console clicks.

## Shared responsibility

| Model | You manage | The provider manages | Example |
| --- | --- | --- | --- |
| **IaaS** | Operating system, runtime, application | Hardware, network, virtualization | Virtual machine (Azure VM, EC2) |
| **CaaS** | Container image, scaling rules | Orchestration (partly or fully) | AKS, EKS, Azure Container Apps, ECS/Fargate |
| **PaaS** | Application code and configuration | Operating system, patches, scaling infrastructure | Azure App Service, Elastic Beanstalk |
| **Serverless (FaaS)** | Only the function | Everything. Pay per use | Azure Functions, AWS Lambda |

The further down you go, the more control you have, and the more operational burden too. The further up you go, the more speed and convenience you get, and the less flexibility.

## Application hosting

| Need | Azure | AWS |
| --- | --- | --- |
| Publish a web API the easiest way | App Service | Elastic Beanstalk, App Runner |
| Containers, without knowing Kubernetes | **Container Apps** | ECS + Fargate, App Runner |
| Full Kubernetes | AKS | EKS |
| Event-triggered, short-lived jobs | Functions | Lambda |
| Virtual machine | Virtual Machines | EC2 |

**When serverless?** Irregular, bursty load (nightly batch jobs, webhooks) and event-triggered work (a message arrived on a queue, a file was uploaded). **When not?** Sustained high traffic (an always-on instance is cheaper), long-running jobs, and APIs that are sensitive to cold start latency.

For new .NET services on Azure, a sensible default is **Container Apps**: it's container-based, can scale to zero, scales on queue length with KEDA, and hides the complexity of Kubernetes.

## Data

| Need | Azure | AWS |
| --- | --- | --- |
| Managed SQL Server | Azure SQL Database | RDS for SQL Server |
| Managed PostgreSQL | Azure Database for PostgreSQL | RDS / Aurora PostgreSQL |
| Globally distributed NoSQL | **Cosmos DB** | DynamoDB |
| Cache (Redis compatible) | Azure Managed Redis | ElastiCache, MemoryDB |
| File and object storage | Blob Storage | **S3** |
| Search | Azure AI Search | OpenSearch Service |

With managed databases, backups, patching, high availability, and replicas are the provider's job. You deal with connection limits, choosing the scale (vCore or DTU), indexes, and query performance.

**Cosmos DB** comes up often in interviews: the choice of partition key determines performance. A bad key leads to a hot partition. It offers five consistency levels (strong, bounded staleness, session, consistent prefix, eventual). Cost is measured in **request units (RU)**.

## Messaging and integration

| Need | Azure | AWS |
| --- | --- | --- |
| Enterprise queues and publish-subscribe | **Service Bus** | SQS + SNS |
| High-volume event streaming | Event Hubs | Kinesis, MSK (Kafka) |
| Event routing (reacting to resource events) | Event Grid | EventBridge |
| Simple, cheap queue | Storage Queues | SQS |
| Workflow orchestration | Durable Functions, Logic Apps | Step Functions |

## Identity and secrets

- **Microsoft Entra ID** (formerly Azure AD) is the identity provider in Azure. User sign-in (OIDC) and application identities live here. The AWS equivalent is **IAM**, plus Cognito or IAM Identity Center for users.
- **Managed Identity** (an IAM Role on AWS): lets the application access cloud resources **without passwords**. There's no connection string or key in the code:

```csharp
var credential = new DefaultAzureCredential();   // locally: the developer's session; in the cloud: Managed Identity

var blobs = new BlobServiceClient(new Uri("https://ordersdocs.blob.core.windows.net"), credential);
builder.Configuration.AddAzureKeyVault(new Uri("https://orders-kv.vault.azure.net/"), credential);
```

- **Key Vault** (Secrets Manager and KMS on AWS): secrets, encryption keys, and certificates.
- **Least privilege:** each application identity gets only the role it needs ("Storage Blob Data Reader," not "Contributor" on the whole subscription).

## Monitoring

| Need | Azure | AWS |
| --- | --- | --- |
| Application monitoring (APM), distributed tracing | **Application Insights** (Azure Monitor) | X-Ray, CloudWatch Application Signals |
| Log collection and querying | Log Analytics (the KQL language) | CloudWatch Logs (Logs Insights) |
| Metrics and alerts | Azure Monitor | CloudWatch |

Both support OpenTelemetry. Instrumenting your application with OpenTelemetry makes switching providers easier. On the Azure side, you connect in a single line with the `Azure.Monitor.OpenTelemetry.AspNetCore` package: `builder.Services.AddOpenTelemetry().UseAzureMonitor();`.

## Networking and the front door

| Need | Azure | AWS |
| --- | --- | --- |
| Private network | Virtual Network (VNet) | VPC |
| API management, keys, quotas | API Management | API Gateway |
| Global entry point, CDN, WAF | Front Door | CloudFront + WAF |
| Regional load balancer (L7) | Application Gateway | Application Load Balancer |
| Private network access to a service | Private Endpoint | PrivateLink |

Good practice: the database and cache are not exposed to the internet. Applications reach them through private network endpoints.

## Managing infrastructure as code (IaC)

Creating resources by clicking around the portal is neither repeatable nor auditable. With IaC, infrastructure is versioned as code, reviewed, and even tested.

| Tool | Note |
| --- | --- |
| **Terraform / OpenTofu** | Multi-cloud, the most widespread. Requires managing a state file |
| **Bicep** | Azure-specific, a readable form of ARM templates |
| **AWS CloudFormation / CDK** | AWS-specific. With CDK you write infrastructure in real languages, including C# |
| **Pulumi** | Multi-cloud with real languages (including C#) |
| **.NET Aspire + azd** | Defines the local development setup and generates the infrastructure for deploying to Azure |

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

## Resilience and cost

- **Regions and availability zones:** physically separate data centers within a region. Critical services are spread across more than one zone. For disaster recovery, a second region is planned. The **RTO** (how quickly you recover) and **RPO** (how much data loss is acceptable) targets shape the architecture.
- **Cost is a design input:** right-sizing, shutting down unused resources, reserved capacity for steady load, serverless for irregular load, data egress fees, and log volume. Set up budget alerts.
- **Certifications:** Azure and AWS developer and architect certifications appear as a plus in many postings. Exam codes change from time to time, so check the current list on the Microsoft Learn and AWS Training pages.

## Asked in interviews

- **"How do you choose between App Service, Container Apps, AKS, and Functions?"** Based on the team's skills, the need for control, the load profile, and cost. Without Kubernetes expertise, Container Apps or App Service. Functions for short, event-triggered jobs.
- **"Where do you store the password the application uses to access Key Vault?"** I don't. I use Managed Identity and `DefaultAzureCredential`.
- **"What are the downsides of serverless?"** Cold starts, execution time limits, high cost under sustained load, difficulty debugging locally, and vendor lock-in.
- **"Why manage infrastructure as code?"** Repeatability, review, version history, consistency across environments, and rebuilding after a disaster.
- **"How do you choose a partition key in Cosmos DB?"** A high-cardinality field that spreads the load evenly and is used as a filter in frequent queries.

## Summary

- Going from IaaS to serverless, control decreases while speed and convenience increase.
- On Azure, Container Apps is a sensible default for new container services. AKS is for full control, Functions for event-triggered work.
- Being able to map the Azure and AWS equivalents of data, messaging, identity, and monitoring services is enough depth for an interview.
- Passwordless identity (Managed Identity, IAM Role) and least privilege are core security principles.
- Infrastructure is managed as code. Cost, RTO, and RPO are inputs to the design.
