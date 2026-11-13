import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';
import { SEED_PASSWORD, seedBase } from '../scripts/db-tasks.js';

/** 清空資料，只留下 seed 的使用者與會議室（沒有任何預約） */
export async function resetData() {
  await seedBase(pool);
}

export async function loginAs(email: string): Promise<string> {
  const res = await request(app).post('/api/login').send({ email, password: SEED_PASSWORD }).expect(200);
  return res.body.token;
}

/** 台北時間「今天往後第 days 天的 hh:mm」，回傳 ISO 字串 */
export function taipei(days: number, hhmm: string): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(d);
  return new Date(`${date}T${hhmm}:00+08:00`).toISOString();
}
