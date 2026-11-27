---
title: Containers with Docker
summary: The difference between a container and a virtual machine, images and layers, a multi-stage Dockerfile for .NET, the layer cache, small and secure images, a non-root user, a local environment with docker compose, and common mistakes.
---

7 of the 18 job postings explicitly ask for Docker. Most of the rest mention "container-based deployment" or Kubernetes, which also assumes Docker knowledge. Zirve itself is deployed with `docker-compose.yml` and Dockerfiles. This lesson shows how to package a .NET service correctly and covers the core interview questions.

## What is a container?

A container packages an application **together with its dependencies** and runs it as a process isolated from the operating system. It solves the "it worked on my machine" problem by packaging the machine itself.

| | Virtual machine | Container |
| --- | --- | --- |
| What it virtualizes | The hardware | The operating system |
| Kernel | Each VM has its own kernel | The host's kernel is shared |
| Size | GBs | MBs |
| Startup | Minutes | Seconds |
| Isolation | Strong | Weaker (same kernel) |

On Linux, container isolation comes from two kernel features: **namespaces** (what a process can see: the process list, the network, the file system) and **cgroups** (how much it can use: CPU, memory).

## Image, layer, container

- **Image:** a read-only template. It is made up of layers.
- **Layer:** every instruction in a Dockerfile (`RUN`, `COPY`) produces a layer. Layers are cached and shared between images.
- **Container:** a running instance of an image. A thin writable layer is added on top. When the container is deleted, that layer goes with it.
- **Registry:** the repository where images are stored (Docker Hub, GitHub Container Registry, Azure Container Registry, Amazon ECR).

The consequence: **containers are ephemeral.** Data that must persist (database files, uploads) lives in a **volume** or in an external service.

## A multi-stage Dockerfile for .NET

```dockerfile
# 1) Build stage: the SDK is large (~800 MB), only here
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Project files only first: as long as dependencies don't change, the restore layer comes from the cache
COPY Directory.Packages.props Directory.Build.props ./
COPY src/Orders.Api/Orders.Api.csproj src/Orders.Api/
RUN dotnet restore src/Orders.Api/Orders.Api.csproj

# Then the source code: when code changes, only the steps from here on run again
COPY src/ src/
RUN dotnet publish src/Orders.Api/Orders.Api.csproj -c Release -o /app --no-restore

# 2) Runtime stage: only the runtime (under ~100 MB)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS final
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Orders.Api.dll"]
```

Every decision in this file is an interview question:

- **Multi-stage build:** the SDK, the source code, and intermediate files don't end up in the final image. The image gets smaller and the attack surface shrinks.
- **Layer order:** what changes often (the source code) goes last. Starting with `COPY . .` and then running `restore` makes every code change download all the packages again.
- **Chiseled image:** a minimal Ubuntu-based image with no shell and no package manager. Fewer vulnerabilities show up in security scans. The trade-off: you can't get inside the container and debug with `bash`.
- **Non-root user:** since .NET 8, the official images come with an `app` user ready to use (`$APP_UID`). If the container is compromised, the attacker doesn't get root.
- **Port 8080:** since .NET 8, ASP.NET Core images listen on **8080** by default, not 80, because a non-root user can't open ports below 1024.

A `.dockerignore` file is also a must: `bin/`, `obj/`, `.git/`, `node_modules/`, and secret files are not sent to the build context.

An alternative: the .NET SDK can also produce an image without a Dockerfile: `dotnet publish -t:PublishContainer`. It's a practical option for simple services.

## Basic commands

```bash
docker build -t orders-api:1.4.2 .
docker run -d --name orders -p 5000:8080 -e ConnectionStrings__Db="Host=db;..." orders-api:1.4.2
docker ps                      # running containers
docker logs -f orders          # follow the logs
docker exec -it orders sh      # get inside (no shell in a chiseled image)
docker stop orders && docker rm orders
docker image prune             # clean up unused images
```

- `-p 5000:8080`: maps port 5000 on the host to port 8080 in the container.
- `-e`: an environment variable. In ASP.NET Core, `__` (two underscores) stands in for the `:` separator in configuration.
- Using `latest` as the tag makes it unclear which version is running. In production, use a version number or a commit hash.

## A local environment with docker compose

To bring up the application, the database, Redis, and RabbitMQ with a single command:

```yaml
services:
  api:
    build: .
    ports: ["5000:8080"]
    environment:
      ConnectionStrings__Db: "Host=db;Database=orders;Username=app;Password=dev-only"
      ConnectionStrings__Redis: "redis:6379"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: dev-only
      POSTGRES_DB: orders
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

- Services in the same compose file reach each other **by service name** (`Host=db`). Inside a container, `localhost` is the container itself, not the host machine. This is the most common connection mistake.
- `depends_on` only determines the startup order. To wait for the database to be **ready**, you need `condition: service_healthy` and a `healthcheck`. Even so, the application should be written to retry gracefully if a dependency becomes ready late.

## Security and good practices

- **Don't bake secrets into the image.** A password that comes in through `ENV PASSWORD=...` or `COPY appsettings.Production.json` is in the hands of everyone who pulls the image. Even if the layers are deleted, it stays in the history. Secret values are provided at runtime through environment variables, Docker/Kubernetes secrets, or a vault service.
- **Scan your images:** look for known vulnerabilities with Trivy, Docker Scout, or the registry's built-in scanner. Update the base image regularly.
- **One process per container.** Running several things in the same container makes scaling and log collection harder.
- **Logs go to stdout.** Instead of writing logs to a file inside the container, write them to standard output. The platform collects them.
- **Handle signals correctly.** `docker stop` first sends `SIGTERM`, then `SIGKILL` when the timeout (`10 s`) expires. The .NET host receives `SIGTERM` and shuts down gracefully. That's why it matters that `ENTRYPOINT` is written in exec form (`["dotnet", "..."]`): the shell form may not forward the signal to the application.
- **Resource limits:** `--memory` and `--cpus`. The .NET runtime detects container limits and tunes the GC and the thread pool accordingly.

## Asked in interviews

- **"What's the difference between a container and a virtual machine?"** A VM virtualizes the hardware and carries its own kernel. A container shares the kernel; it's lighter, but its isolation is weaker.
- **"Why a multi-stage build?"** The SDK and the source code don't end up in the final image. The image is smaller and more secure.
- **"Why does layer order matter in a Dockerfile?"** Everything after a changed layer runs again. Project files and restore first, then the source code.
- **"What happens to the data when a container is deleted?"** The writable layer is gone. Persistent data is kept in a volume or an external service.
- **"The API container can't connect to the database via `localhost`. Why?"** Inside a container, `localhost` is the container itself. In Compose, I use the service name.

## Summary

- A container is an isolated process that packages an application with its dependencies and shares the kernel.
- An image is made of layers. Put what changes often last.
- For .NET: a multi-stage build, a small (chiseled) runtime image, a non-root user, and port 8080.
- In Compose, services talk to each other by name. Wait for readiness with a health check.
- Secrets stay out of the image, images get scanned, logs go to stdout, and signals are handled correctly.
