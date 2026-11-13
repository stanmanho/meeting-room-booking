// 在子資料夾（backend / web）執行 npm 指令，例如：node scripts/npm-in.mjs backend run dev
// 不用 `npm --prefix`：Windows 上的 npm 10 會把它誤判成根目錄，造成無限重複安裝。
import { spawn } from 'node:child_process';

const [dir, ...args] = process.argv.slice(2);

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^npm_config_(local_)?prefix$/i.test(key)) delete env[key];
}

const child = spawn(`npm ${args.join(' ')}`, { cwd: dir, stdio: 'inherit', shell: true, env });

// Ctrl+C 交給子程序處理（例如資料庫要正常關閉），子程序結束後這裡再結束
process.on('SIGINT', () => {});
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
