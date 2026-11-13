// 本機開發用：清空資料庫 → 重跑全部 migration → 塞入 seed 資料
import { pool } from '../src/db.js';
import { dropAll, migrate, seed } from './db-tasks.js';

await dropAll(pool);
await migrate(pool);
await seed(pool);
console.log('資料庫已重置');
await pool.end();
