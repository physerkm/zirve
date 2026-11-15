# syntax=docker/dockerfile:1
# Derleme bağlamı depo köküdür:  docker build -f src/Zirve.Runner/Dockerfile .
#
# Bu görüntü KULLANICI KODU ÇALIŞTIRIR. Güvenlik sınırı bu kapsayıcının kendisidir; docker-compose.yml
# içindeki kısıtlarla (ağsız iç ağ, salt-okunur dosya sistemi, yetkisiz kullanıcı, kaynak sınırları) çalıştırın.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/Zirve.Shared/Zirve.Shared.csproj src/Zirve.Shared/
COPY src/Zirve.Runner/Zirve.Runner.csproj src/Zirve.Runner/
RUN dotnet restore src/Zirve.Runner/Zirve.Runner.csproj
COPY src/Zirve.Shared src/Zirve.Shared
COPY src/Zirve.Runner src/Zirve.Runner
RUN dotnet publish src/Zirve.Runner/Zirve.Runner.csproj -c Release -o /app/publish --no-restore

# TypeScript dönüştürücüsü (amaro) kilit dosyasındaki sabit sürümle kurulur.
FROM node:24-bookworm-slim AS node
WORKDIR /node
COPY src/Zirve.Runner/Node/package.json src/Zirve.Runner/Node/package-lock.json ./
RUN npm ci --omit=dev

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=build /app/publish .
COPY --from=node /node/node_modules ./Node/node_modules

ENV ASPNETCORE_HTTP_PORTS=8080 \
    Runner__WorkDirectory=/tmp/zirve-runner \
    DOTNET_gcServer=0

USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Zirve.Runner.dll"]
