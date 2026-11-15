// Yerel geliştirme için gömülü PostgreSQL. Docker ya da sistem genelinde PostgreSQL kurulumu gerektirmez.
//
// İkili dosyalar `embedded-postgres` npm paketinin platforma özel alt paketinden gelir; sunucu `pg_ctl`
// ile yönetilir (Windows'ta yönetici yetkili kabuklarda da çalışabilmesi için). Veriler depo kökündeki
// .pgdata klasöründe saklanır (git'e eklenmez); sıfırlamak için sunucuyu durdurup klasörü silmeniz yeterlidir.
//
// Üretimde bu betik KULLANILMAZ; orada docker-compose içindeki ya da yönetilen bir PostgreSQL kullanılır.
import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import pg from 'pg';

const run = promisify(execFile);

export const DEV_DATABASE = {
  host: 'localhost',
  port: Number(process.env.ZIRVE_DB_PORT ?? 5433),
  database: 'zirve',
  user: 'zirve',
  password: 'zirve_dev_password',
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = join(root, '.pgdata');
const logFile = join(dataDirectory, 'server.log');

async function loadBinaries() {
  const platform = { win32: 'windows', darwin: 'darwin', linux: 'linux' }[os.platform()];
  if (!platform) throw new Error(`Desteklenmeyen işletim sistemi: ${os.platform()}`);

  try {
    return await import(`@embedded-postgres/${platform}-${os.arch()}`);
  } catch (error) {
    throw new Error(
      `PostgreSQL ikili dosyaları bulunamadı (@embedded-postgres/${platform}-${os.arch()}). Depo kökünde "npm install" çalıştırın.`,
      { cause: error },
    );
  }
}

async function isRunning(pgCtl) {
  try {
    await run(pgCtl, ['status', '-D', dataDirectory]);
    return true;
  } catch {
    return false; // pg_ctl status: sunucu çalışmıyorsa sıfırdan farklı çıkış kodu döner.
  }
}

async function initialise(initdb) {
  console.log('[db] İlk kurulum: veritabanı kümesi oluşturuluyor…');
  const temp = await mkdtemp(join(os.tmpdir(), 'zirve-db-'));
  const passwordFile = join(temp, 'pw');

  try {
    await writeFile(passwordFile, DEV_DATABASE.password, { mode: 0o600 });
    await run(initdb, [
      '-D', dataDirectory,
      '-U', DEV_DATABASE.user,
      `--pwfile=${passwordFile}`,
      '--auth=scram-sha-256',
      // Windows'ta varsayılan kodlama yerel ayara göre (ör. WIN1254) seçilir; UTF-8'i zorunlu kılıyoruz.
      '--encoding=UTF8',
      '--locale=C',
    ]);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function ensureDatabase() {
  const client = new pg.Client({ ...DEV_DATABASE, database: 'postgres' });
  await client.connect();

  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DEV_DATABASE.database]);
    if (existing.rowCount === 0) {
      // Veritabanı adı sabit ve güvenilir; tanımlayıcılar parametre olarak verilemez.
      await client.query(`CREATE DATABASE "${DEV_DATABASE.database}" ENCODING 'UTF8' TEMPLATE template0`);
      console.log(`[db] "${DEV_DATABASE.database}" veritabanı oluşturuldu.`);
    }
  } finally {
    await client.end();
  }
}

/**
 * Veritabanını başlatır (gerekirse ilk kurulumu yapar) ve durdurma fonksiyonunu döndürür.
 * Sunucu zaten çalışıyorsa ona bağlanır ve durdurma fonksiyonu hiçbir şey yapmaz.
 */
export async function startDevDatabase() {
  const { pg_ctl: pgCtl, initdb } = await loadBinaries();

  if (!existsSync(join(dataDirectory, 'PG_VERSION'))) {
    await initialise(initdb);
  }

  const alreadyRunning = await isRunning(pgCtl);

  if (!alreadyRunning) {
    // stdio 'ignore' şart: sunucu süreci pg_ctl'in çıktı borularını miras alır; boru açık kalırsa
    // bu betik pg_ctl bittikten sonra bile sonsuza dek bekler. Sunucu günlükleri -l dosyasına gider.
    await new Promise((resolvePromise, reject) => {
      const child = spawn(
        pgCtl,
        ['start', '-w', '-D', dataDirectory, '-l', logFile, '-o', `-p ${DEV_DATABASE.port} -c listen_addresses=localhost`],
        { stdio: 'ignore', windowsHide: true },
      );
      child.once('error', reject);
      child.once('exit', (code) => (code === 0
        ? resolvePromise()
        : reject(new Error(`PostgreSQL başlatılamadı (pg_ctl çıkış kodu ${code}). Günlük: ${logFile}`))));
    });
  }

  await ensureDatabase();
  console.log(
    `[db] PostgreSQL ${alreadyRunning ? 'zaten çalışıyordu' : 'hazır'}: `
    + `postgres://${DEV_DATABASE.user}@${DEV_DATABASE.host}:${DEV_DATABASE.port}/${DEV_DATABASE.database}`,
  );

  return async () => {
    if (alreadyRunning) return;

    try {
      await run(pgCtl, ['stop', '-D', dataDirectory, '-m', 'fast', '-w']);
      console.log('[db] PostgreSQL durduruldu.');
    } catch (error) {
      console.error(`[db] PostgreSQL durdurulamadı: ${error.message}`);
    }
  };
}

/** Çalışan geliştirme veritabanını durdurur (npm run db -- stop). */
export async function stopDevDatabase() {
  const { pg_ctl: pgCtl } = await loadBinaries();

  if (await isRunning(pgCtl)) {
    await run(pgCtl, ['stop', '-D', dataDirectory, '-m', 'fast', '-w']);
    console.log('[db] PostgreSQL durduruldu.');
  } else {
    console.log('[db] PostgreSQL zaten çalışmıyor.');
  }
}

// Doğrudan çalıştırıldıysa:  npm run db          -> başlat, Ctrl+C'ye kadar açık kal
//                            npm run db -- start  -> başlat ve çık (sunucu arka planda kalır)
//                            npm run db -- stop   -> durdur
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] ?? 'run';

  if (command === 'stop') {
    await stopDevDatabase();
  } else if (command === 'start') {
    await startDevDatabase();
  } else {
    const stop = await startDevDatabase();
    let stopping = false;

    const shutdown = async () => {
      if (stopping) return;
      stopping = true;
      await stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    console.log('[db] Durdurmak için Ctrl+C.');
    setInterval(() => {}, 1 << 30); // Süreci açık tut.
  }
}
