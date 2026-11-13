import fs from 'node:fs';
import path from 'node:path';
import type pg from 'pg';
import { hashPassword } from '../src/auth.js';

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../migrations');

/** 依檔名順序執行還沒跑過的 migration，已執行的記錄在 schema_migrations */
export async function migrate(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  const { rows } = await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  ✔ ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`migration ${file} 失敗：${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
}

/** 本機開發用：清空整個 schema（正式環境不會用到） */
export async function dropAll(pool: pg.Pool): Promise<void> {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}

export const SEED_PASSWORD = 'password123';

export const SEED_USERS = [
  { name: '陳怡君', email: 'yijun@example.com', role: 'member' },
  { name: '林志豪', email: 'zhihao@example.com', role: 'member' },
  { name: '張雅婷', email: 'yating@example.com', role: 'admin' },
  { name: '佐藤健', email: 'sato@example.com', role: 'member' },
] as const;

export const SEED_ROOMS = [
  { name: '101 小會議室', capacity: 4, location: '台北', timezone: 'Asia/Taipei' },
  { name: '201 中會議室', capacity: 8, location: '台北', timezone: 'Asia/Taipei' },
  { name: '大會議室', capacity: 20, location: '台北', timezone: 'Asia/Taipei' },
  { name: 'Sakura', capacity: 6, location: '東京', timezone: 'Asia/Tokyo' },
] as const;

/** 台北「今天」往後 offsetDays 天的日期，格式 YYYY-MM-DD */
function taipeiDate(offsetDays: number): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const TAIPEI = '+08:00';
const TOKYO = '+09:00';
const at = (days: number, time: string, offset = TAIPEI) => new Date(`${taipeiDate(days)}T${time}${offset}`);

export async function seedBase(pool: pg.Pool): Promise<void> {
  await pool.query('TRUNCATE bookings, rooms, users RESTART IDENTITY CASCADE');
  for (const u of SEED_USERS) {
    await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', [
      u.name,
      u.email,
      hashPassword(SEED_PASSWORD),
      u.role,
    ]);
  }
  for (const r of SEED_ROOMS) {
    await pool.query('INSERT INTO rooms (name, capacity, location, timezone) VALUES ($1, $2, $3, $4)', [
      r.name,
      r.capacity,
      r.location,
      r.timezone,
    ]);
  }
}

export async function seed(pool: pg.Pool): Promise<void> {
  await seedBase(pool);

  // [room_id, user_id, title, start, end, created_at?, cancelled_at?]
  const bookings: Array<[number, number, string, Date, Date, Date?, Date?]> = [
    [1, 1, '工程部晨會', at(1, '07:30:00'), at(1, '08:30:00')],
    [2, 2, '產品週會', at(1, '10:00:00'), at(1, '11:00:00')],
    [3, 3, '全體月會', at(1, '14:00:00'), at(1, '16:00:00')],
    [4, 4, '東京チーム定例', at(2, '09:00:00', TOKYO), at(2, '10:00:00', TOKYO)],
    [1, 2, '1on1', at(2, '13:00:00'), at(2, '13:30:00')],
    [2, 1, '面試', at(3, '15:00:00'), at(3, '16:00:00'), at(-1, '11:20:00'), at(0, '08:05:00')],
    // 上週的事故：兩個人同時按下預約，兩筆都成功了
    [2, 1, '客戶訪談', at(-7, '14:00:00'), at(-7, '15:00:00'), at(-8, '10:15:03.120')],
    [2, 2, '供應商會議', at(-7, '14:00:00'), at(-7, '15:00:00'), at(-8, '10:15:03.161')],
    [3, 1, 'Q4 業務檢討', at(4, '10:00:00'), at(4, '11:00:00'), at(-1, '09:02:11.408')],
    [3, 2, '新人訓練', at(4, '10:00:00'), at(4, '11:00:00'), at(-1, '09:02:11.437')],
  ];

  for (const [roomId, userId, title, start, end, createdAt, cancelledAt] of bookings) {
    await pool.query(
      `INSERT INTO bookings (room_id, user_id, title, start_at, end_at, created_at, cancelled_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, now()), $7)`,
      [roomId, userId, title, start, end, createdAt ?? null, cancelledAt ?? null],
    );
  }
}
