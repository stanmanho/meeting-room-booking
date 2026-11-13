import { pool } from '../src/db.js';
import { seed, SEED_PASSWORD, SEED_USERS } from './db-tasks.js';

await seed(pool);
console.log('seed 完成，可用以下帳號登入（密碼都是 %s）：', SEED_PASSWORD);
for (const u of SEED_USERS) console.log(`  ${u.email}  ${u.name}${u.role === 'admin' ? '（管理員）' : ''}`);
await pool.end();
