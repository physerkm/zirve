# syntax=docker/dockerfile:1
# Derleme bağlamı depo köküdür:  docker build -f src/Zirve.Runner/Dockerfile .
#
# Bu görüntü KULLANICI KODU ÇALIŞTIRIR. docker-compose.yml içindeki kısıtlarla (iç ağ, salt-okunur dosya sistemi,
# yalnızca beş Linux yetkisi, kaynak sınırları) çalıştırın.
#
# Runner süreci root'tur ama yalnızca SETUID, SETGID, KILL, CHOWN ve DAC_OVERRIDE yetkilerine sahiptir. Bunlar
# çalıştırma başına yalıtım içindir (Runner:Isolation): kullanıcı kodu her yuva için ayrı, hiçbir yetkisi olmayan
# bir kullanıcıyla (uid 20000+) ve veri belleği sınırıyla çalışır; Runner'a ve başka çalıştırmalara erişemez.

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

# Çalıştırma başına yalıtım setpriv (util-linux) ve /bin/sh kullanır; görüntüde yoksa kurulur.
RUN if ! command -v setpriv > /dev/null; then \
      apt-get update && apt-get install -y --no-install-recommends util-linux && rm -rf /var/lib/apt/lists/*; \
    fi \
    && test -x /usr/bin/setpriv && test -x /bin/sh

WORKDIR /app
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=build /app/publish .
COPY --from=node /node/node_modules ./Node/node_modules

ENV ASPNETCORE_HTTP_PORTS=8080 \
    Runner__WorkDirectory=/tmp/zirve-runner \
    Runner__Isolation__Enabled=true \
    DOTNET_gcServer=0

# Bilerek USER yok: yalıtım için Runner root olarak (yalnızca yukarıdaki beş yetkiyle) çalışır;
# kullanıcı kodu ise her zaman yetkisiz bir kullanıcıya geçirilir.
EXPOSE 8080
ENTRYPOINT ["dotnet", "Zirve.Runner.dll"]
