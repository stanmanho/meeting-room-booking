import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';
import { loginAs, resetData, taipei } from './helpers.js';

afterAll(() => pool.end());

describe('POST /api/bookings', () => {
  let token: string;

  beforeEach(async () => {
    await resetData();
    token = await loginAs('yijun@example.com');
  });

  it('可以預約空的時段', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: 1, title: '週會', startAt: taipei(2, '10:00'), endAt: taipei(2, '11:00') })
      .expect(201);

    expect(res.body).toMatchObject({ roomId: 1, title: '週會', startAt: taipei(2, '10:00') });
  });

  it('同一個時段不能重複預約', async () => {
    const body = { roomId: 1, title: '週會', startAt: taipei(2, '10:00'), endAt: taipei(2, '11:00') };
    await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(body).expect(201);
    await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(body).expect(409);
  });

  it('沒登入不能預約', async () => {
    await request(app)
      .post('/api/bookings')
      .send({ roomId: 1, title: '週會', startAt: taipei(2, '10:00'), endAt: taipei(2, '11:00') })
      .expect(401);
  });

  it('時間不是 15 分鐘為單位會被拒絕', async () => {
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: 1, title: '週會', startAt: taipei(2, '10:05'), endAt: taipei(2, '11:00') })
      .expect(422);
  });
});

describe('DELETE /api/bookings/:id', () => {
  beforeEach(resetData);

  it('可以取消自己的預約', async () => {
    const token = await loginAs('yijun@example.com');
    const created = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: 2, title: '面試', startAt: taipei(3, '15:00'), endAt: taipei(3, '16:00') })
      .expect(201);

    await request(app).delete(`/api/bookings/${created.body.id}`).set('Authorization', `Bearer ${token}`).expect(204);

    const mine = await request(app).get('/api/bookings/mine').set('Authorization', `Bearer ${token}`).expect(200);
    expect(mine.body).toEqual([]);
  });
});
