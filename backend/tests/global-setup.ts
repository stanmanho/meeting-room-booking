import pg from 'pg';
import { dropAll, migrate } from '../scripts/db-tasks.js';

// 每次跑測試前，把測試資料庫清空並重跑 migration
export default async function setup() {
  try {
    process.loadEnvFile();
  } catch {
    // 沒有 .env 就用環境變數
  }

  // 會清空整個資料庫，所以一定要明確指定、而且是測試用的資料庫
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('缺少環境變數 TEST_DATABASE_URL，無法執行測試');
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error(`TEST_DATABASE_URL 必須指向測試用的資料庫（名稱含 test），目前是：${new URL(url).pathname}`);
  }

  const pool = new pg.Pool({ connectionString: url });
  try {
    await dropAll(pool);
    await migrate(pool);
  } finally {
    await pool.end();
  }
}
