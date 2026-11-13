import { pool } from '../src/db.js';
import { migrate } from './db-tasks.js';

await migrate(pool);
console.log('migrate 完成');
await pool.end();
