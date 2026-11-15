# syntax=docker/dockerfile:1
# Derleme bağlamı depo köküdür:  docker build -f src/Zirve.Api/Dockerfile .

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Önce yalnızca proje dosyaları kopyalanır: kaynak değişse bile paket geri yükleme katmanı önbellekten gelir.
COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/Zirve.Shared/Zirve.Shared.csproj src/Zirve.Shared/
COPY src/Zirve.Api/Zirve.Api.csproj src/Zirve.Api/
RUN dotnet restore src/Zirve.Api/Zirve.Api.csproj

COPY src/Zirve.Shared src/Zirve.Shared
COPY src/Zirve.Api src/Zirve.Api
RUN dotnet publish src/Zirve.Api/Zirve.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY content ./content

ENV ASPNETCORE_HTTP_PORTS=8080 \
    Content__Path=/app/content \
    DOTNET_gcServer=0

# Görüntüdeki yerleşik, yetkisiz kullanıcı.
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Zirve.Api.dll"]
