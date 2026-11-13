// 不需要 Docker 的本機資料庫。第一次執行會初始化 PostgreSQL，資料存放在 backend/.pgdata
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import pg from 'pg';

const PORT = 5433;
const backendDir = path.resolve(import.meta.dirname, '..');
const dataDir = path.join(backendDir, '.pgdata');
const tmpDir = path.join(backendDir, '.pgtmp');
const logFile = path.join(tmpDir, 'postgres.log');

function fail(lines: string[]): never {
  console.error(['', ...lines, ''].join('\n'));
  process.exit(1);
}

function lastLogLines(): string[] {
  try {
    return fs.readFileSync(logFile, 'utf8').trim().split('\n').slice(-8).map((l) => `   ${l}`);
  } catch {
    return [];
  }
}

// PostgreSQL 在 Windows 上無法處理含有中文等非英文字元的路徑
if (process.platform === 'win32' && /[^\x00-\x7F]/.test(backendDir)) {
  fail([
    '❌ 專案所在的路徑含有中文或其他非英文字元，PostgreSQL 在 Windows 上無法使用這種路徑：',
    `   ${backendDir}`,
    '',
    '請把專案移到只有英文的路徑，例如：',
    '   C:\\dev\\meeting-room-booking',
    '移動後重新執行 npm install 和 npm run db。',
  ]);
}

// 暫存檔放在專案裡，避免 Windows 使用者名稱是中文時，系統暫存資料夾的路徑含有中文
fs.mkdirSync(tmpDir, { recursive: true });
if (process.platform === 'win32') {
  process.env.TEMP = tmpDir;
  process.env.TMP = tmpDir;
}

const portInUse = await new Promise<boolean>((resolve) => {
  const socket = net.connect(PORT, '127.0.0.1');
  socket.once('connect', () => {
    socket.destroy();
    resolve(true);
  });
  socket.once('error', () => resolve(false));
});
if (portInUse) {
  fail([
    `⚠️  port ${PORT} 已經被使用，資料庫可能已經在另一個視窗啟動了。`,
    '   如果是，直接使用即可；如果不是，請關閉佔用這個 port 的程式後再試一次。',
  ]);
}

// PostgreSQL 執行檔來自 embedded-postgres 依作業系統安裝的套件
const platformPackage =
  process.platform === 'win32' ? '@embedded-postgres/windows-x64' : `@embedded-postgres/${process.platform}-${process.arch}`;
const { pg_ctl: pgCtl } = (await import(platformPackage)) as { pg_ctl: string };

function pgCtlRun(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pgCtl, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('error', reject);
    // 用 exit 而不是 close：Windows 上 postgres 會繼承輸出管線，要等資料庫關閉才會觸發 close
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(output.trim().split('\n').pop() || `pg_ctl 結束代碼 ${code}`));
    });
  });
}

const firstRun = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));
if (firstRun) {
  console.log('第一次啟動，正在初始化資料庫（約 10～30 秒）…');
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const init = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'booking',
    password: 'booking',
    port: PORT,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
  });
  try {
    await init.initialise();
  } catch (err) {
    fs.rmSync(dataDir, { recursive: true, force: true });
    fail(['❌ 資料庫初始化失敗：', `   ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`]);
  }
}

// 上次沒有正常關閉（例如直接關掉視窗）時會留下這個檔案，port 沒人使用就可以安全移除
fs.rmSync(path.join(dataDir, 'postmaster.pid'), { force: true });

// 用 pg_ctl 啟動：在 Windows 上即使以系統管理員身分執行，pg_ctl 也會自動降低權限
try {
  await pgCtlRun(['start', '-D', dataDir, '-o', `-p ${PORT}`, '-l', logFile, '-w', '-t', '60']);
} catch (err) {
  fail([
    '❌ 資料庫啟動失敗：',
    `   ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`,
    ...lastLogLines(),
    '',
    '可以試試：刪除 backend/.pgdata 資料夾後，重新執行 npm run db 和 npm run setup。',
  ]);
}

// 每次都確認資料庫存在（第一次啟動如果中途失敗，下次啟動時補建）
const client = new pg.Client({ connectionString: `postgres://booking:booking@localhost:${PORT}/postgres` });
await client.connect();
for (const name of ['booking', 'booking_test']) {
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  if (!rowCount) await client.query(`CREATE DATABASE ${name}`);
}
await client.end();

console.log(`\nPostgreSQL 已啟動：localhost:${PORT}（按 Ctrl+C 停止）\n`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  console.log('\n正在停止資料庫…');
  await pgCtlRun(['stop', '-D', dataDir, '-m', 'fast', '-w']).catch(() => {});
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('SIGHUP', stop);

// 保持執行，直到按下 Ctrl+C
setInterval(() => {}, 1 << 30);
