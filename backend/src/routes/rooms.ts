import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { findRoom, listRoomBookings, toBookingDto, type RoomRow } from '../services/bookingService.js';

export const roomsRouter = Router();

roomsRouter.get('/', async (_req, res) => {
  const { rows } = await pool.query<RoomRow>('SELECT * FROM rooms ORDER BY id');
  res.json(rows);
});

// GET /api/rooms/:id/bookings?from=ISO&to=ISO（預設：現在起 7 天）
roomsRouter.get('/:id/bookings', async (req, res) => {
  const room = await findRoom(Number(req.params.id));
  if (!room) throw new HttpError(404, '找不到這間會議室');

  const from = req.query.from ? new Date(String(req.query.from)) : new Date();
  const to = req.query.to ? new Date(String(req.query.to)) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new HttpError(422, 'from / to 時間格式錯誤');
  }

  const bookings = await listRoomBookings(room.id, from, to);
  res.json(bookings.map(toBookingDto));
});
