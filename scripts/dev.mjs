// Bütün geliştirme yığınını tek komutla başlatır:  npm run dev
//
//   db      gömülü PostgreSQL (port 5433)          -> scripts/dev-db.mjs
//   runner  kod çalıştırma servisi (port 5081)     -> src/Zirve.Runner
//   api     ASP.NET Core API (port 5080)           -> src/Zirve.Api
//   web     Vite geliştirme sunucusu (port 5173)   -> web
//
// Ctrl+C bütün süreçleri ve veritabanını durdurur.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { startDevDatabase } from './dev-db.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const colors = { runner: '\x1b[35m', api: '\x1b[36m', web: '\x1b[32m', dev: '\x1b[33m' };
const reset = '\x1b[0m';

const log = (name, line) => console.log(`${colors[name] ?? ''}[${name}]${reset} ${line}`);

function requireInstalled(path, hint) {
  if (!existsSync(join(root, path))) {
    console.error(`Eksik kurulum: ${path} bulunamadı. Önce şunu çalıştırın: ${hint}`);
    process.exit(1);
  }
}

requireInstalled('web/node_modules/vite', 'npm run setup');
requireInstalled('src/Zirve.Runner/Node/node_modules/amaro', 'npm run setup');

const children = [];
let shuttingDown = false;

function start(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1', FORCE_COLOR: '1' },
    ...options,
  });

  for (const stream of [child.stdout, child.stderr]) {
    createInterface({ input: stream }).on('line', (line) => log(name, line));
  }

  // Komut bulunamazsa (ör. dotnet PATH'te yok) 'error' gelir; işlenmezse betik çöker ve veritabanı açık kalır.
  child.on('error', (error) => {
    if (shuttingDown) return;
    log('dev', `"${name}" başlatılamadı: ${error.message}. Diğer süreçler durduruluyor.`);
    void shutdown(1);
  });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    log('dev', `"${name}" beklenmedik biçimde sonlandı (çıkış kodu ${code}). Diğer süreçler durduruluyor.`);
    void shutdown(1);
  });

  children.push(child);
  return child;
}

function killTree(child) {
  if (child.exitCode !== null || child.pid === undefined) return;

  if (isWindows) {
    // "dotnet run" asıl uygulamayı alt süreç olarak başlatır; ağacın tamamı sonlandırılmalı.
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    child.kill('SIGTERM');
  }
}

let stopDatabase = async () => {};

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('dev', 'Kapatılıyor…');
  children.forEach(killTree);
  await stopDatabase();
  process.exit(exitCode);
}

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

try {
  stopDatabase = await startDevDatabase();
} catch (error) {
  console.error(`[db] Veritabanı başlatılamadı: ${error.message}`);
  process.exit(1);
}

start('runner', 'dotnet', ['run', '--project', 'src/Zirve.Runner', '--launch-profile', 'http']);
start('api', 'dotnet', ['run', '--project', 'src/Zirve.Api', '--launch-profile', 'http']);
start('web', process.execPath, [join(root, 'web/node_modules/vite/bin/vite.js')], { cwd: join(root, 'web') });

log('dev', 'Site: http://localhost:5173   API belgeleri: http://localhost:5080/scalar   Durdurmak için Ctrl+C.');
