---
title: Linux for Backend Developers
summary: The file system and permissions, processes and signals, systemd, reading logs, network diagnostic tools, monitoring resource usage, text processing commands, and diagnosing a production problem step by step.
---

.NET services now mostly run on Linux, in containers. Some job postings ask for "Linux knowledge," but the real need shows up during an incident rather than in the interview: the service isn't responding and all you have is a terminal. This lesson collects the commands and the way of thinking you need at that moment.

## The file system

| Directory | Contents |
| --- | --- |
| `/etc` | Configuration files |
| `/var/log` | Logs |
| `/var/lib` | Application data (e.g. database files) |
| `/opt`, `/srv` | Manually installed applications, served data |
| `/tmp` | Temporary files |
| `/proc` | Virtual files the kernel exposes about processes |
| `/home/<user>` | User directories |

```bash
pwd; ls -la; cd /var/log
du -sh *                 # folder sizes
df -h                    # disk usage: the first place to look for "disk full" errors
find / -name "*.log" -size +500M 2>/dev/null   # find large log files
```

## Permissions

```text
-rwxr-x---  1 app  app  4096 Nov 24 10:00 run.sh
 │  │  │
 │  │  └── others: nothing
 │  └───── group: read + execute
 └──────── owner: read + write + execute
```

Numeric notation: r=4, w=2, x=1. `750` = owner 7 (rwx), group 5 (r-x), others 0.

```bash
chmod 750 run.sh
chmod +x deploy.sh
chown app:app /var/lib/orders
sudo -u app whoami       # run a command as another user
```

**Don't run services as root.** Each service should run as a separate user that can write only to its own files. Files containing secrets should be `600` (only the owner can read and write).

## Processes and signals

```bash
ps aux | grep Orders     # list processes
top                      # live CPU and memory (htop is more readable)
kill <pid>               # SIGTERM: "please shut down gracefully"
kill -9 <pid>            # SIGKILL: kill immediately (no cleanup possible)
```

| Signal | Meaning |
| --- | --- |
| `SIGTERM` (15) | A request to shut down gracefully. Docker and Kubernetes send this first |
| `SIGKILL` (9) | Forced kill, can't be caught |
| `SIGINT` (2) | `Ctrl+C` |
| `SIGHUP` (1) | The terminal closed. Some services interpret it as "reload the configuration" |

The .NET host catches `SIGTERM`, triggers `IHostApplicationLifetime.ApplicationStopping`, and gives hosted services time to shut down. A service killed with `kill -9` can't finish its in-progress work. That's why `SIGTERM` is always the first choice.

**Exit codes:** `0` means success, anything else is an error. `137` = 128 + 9, meaning the process was killed with `SIGKILL` (in containers, usually because the memory limit was exceeded, OOM). `143` = 128 + 15, it shut down via `SIGTERM`.

## Running a service with systemd

On servers that don't use containers, a .NET application runs as a systemd service:

```ini
# /etc/systemd/system/orders.service
[Unit]
Description=Orders API
After=network.target

[Service]
User=app
WorkingDirectory=/opt/orders
ExecStart=/usr/bin/dotnet /opt/orders/Orders.Api.dll
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now orders     # start at boot and start now
systemctl status orders
journalctl -u orders -f                # the service's logs, live
journalctl -u orders --since "10 min ago"
```

In the application, `builder.Host.UseSystemd()` (the Microsoft.Extensions.Hosting.Systemd package) sends systemd a "ready" notification and converts logs to the right format. A reverse proxy (nginx) in front of it usually terminates TLS.

## Reading logs

```bash
tail -f /var/log/nginx/error.log                 # follow live
tail -n 200 app.log | less                       # last 200 lines, paged
grep -i "timeout" app.log | wc -l                # how many timeouts occurred
grep -C 5 "TraceId=4bf92f" app.log               # 5 lines before and after the match
zgrep "OrderId=8412" app.log.*.gz                # search old compressed logs
```

### Quick analysis with text processing

```bash
# Top 10 IPs by request count
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head

# Distribution of 5xx responses by endpoint
awk '$9 ~ /^5/ {print $7}' access.log | sort | uniq -c | sort -rn | head

# Entries with level Error in JSON logs (with jq)
jq -c 'select(.Level == "Error") | {time: .Timestamp, msg: .RenderedMessage}' app.json | head
```

Combining small tools with a pipe (`|`) is the essence of the Unix philosophy: each tool does one thing, and its output becomes the next one's input.

## Network diagnostics

```bash
curl -v https://api.example.com/health           # request details: DNS, TLS, headers
curl -w "%{time_total}\n" -o /dev/null -s https://api.example.com   # total time
dig api.example.com                               # DNS resolution
nc -zv db.internal 5432                           # is the port open?
ss -tlnp                                          # which process listens on which port on this machine
ss -s                                             # connection summary (TIME_WAIT pile-up?)
ping, traceroute                                  # reachability and route
```

The diagnostic order for "I can't connect to the database": does DNS resolve (`dig`), is the port reachable (`nc`), is TLS fine (`openssl s_client`), are the credentials correct (application log).

## Resource usage

```bash
free -h                  # memory
uptime                   # load average: 1, 5, 15 minutes
vmstat 1                 # CPU, memory, swap, I/O second by second
iostat -x 1              # disk I/O wait
lsof -p <pid> | wc -l    # how many files and sockets the process has open (file descriptor leak?)
ulimit -n                # open file limit
```

Read the load average together with the number of CPU cores: on a 4-core machine, `4.0` means full utilization, and `12.0` means a serious queue.

.NET-specific tools: `dotnet-counters` (GC, thread pool, request count, live), `dotnet-trace` (performance traces), `dotnet-dump` (capturing and analyzing memory dumps). They work inside containers too.

## Diagnosing an incident: an example flow

An "API is slow" alert comes in:

1. **Scope:** every endpoint or just one? All instances or just one? (Metrics dashboard)
2. **Resources:** `top`, `free -h`, `df -h`. Is CPU at 100%, is memory full, is the disk full?
3. **Application:** `dotnet-counters monitor -p <pid>`. Has GC time gone up, is the thread pool queue growing (thread starvation from sync-over-async)?
4. **Dependencies:** database and external service latencies (traces, `curl -w`).
5. **Changes:** when was the last deployment? The cause of most incidents is the latest change.

## Asked in interviews

- **"What's the difference between `kill` and `kill -9`?"** The first sends SIGTERM and lets the application shut down gracefully. The second is SIGKILL and kills it immediately.
- **"A container exited with code 137. What happened?"** It was killed with SIGKILL. Most of the time the memory limit was exceeded (OOMKilled).
- **"The disk is full. How do you find the cause?"** `df -h` for which partition, `du -sh` for which folder. Usually it's logs that aren't being rotated.
- **"Which process is using port 8080?"** `ss -tlnp | grep 8080` or `lsof -i :8080`.
- **"How do you count the errors in a log by endpoint?"** With a chain of `grep`, `awk`, `sort`, and `uniq -c`, or with `jq` for JSON logs.

## Summary

- Know where disks, logs, and configuration live. "Disk full" is tracked down with `df` and `du`.
- Services don't run as root. Secret files have `600` permissions.
- SIGTERM first, SIGKILL as a last resort. Exit code 137 usually means running out of memory.
- systemd and journalctl are the foundation of service management on servers without containers.
- `grep`, `awk`, `sort`, `uniq`, `jq`, plus `curl`, `dig`, and `ss` are the everyday diagnostic tools. For .NET there are `dotnet-counters` and `dotnet-trace`.
