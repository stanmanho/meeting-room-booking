import { pool } from '../db.js';
import { HttpError } from '../errors.js';

export const OPEN_HOUR = 7;
export const CLOSE_HOUR = 22;
const SLOT_MINUTES = 15;
const MAX_DURATION_MINUTES = 4 * 60;

export interface RoomRow {
  id: number;
  name: string;
  capacity: number;
  location: string;
  timezone: string;
}

export interface BookingRow {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  start_at: Date;
  end_at: Date;
  created_at: Date;
  cancelled_at: Date | null;
}

export interface CreateBookingInput {
  roomId: unknown;
  title: unknown;
  startAt: unknown;
  endAt: unknown;
}

/** 兩個時段是否重疊 */
export function isOverlapping(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return (aStart >= bStart && aStart <= bEnd) || (aEnd >= bStart && aEnd <= bEnd);
}

/** 是否在營業時間 07:00–22:00 內 */
export function isWithinBusinessHours(start: Date, end: Date): boolean {
  return start.getHours() >= OPEN_HOUR && end.getHours() <= CLOSE_HOUR;
}

function parseBookingInput(input: CreateBookingInput) {
  const roomId = Number(input.roomId);
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const start = new Date(String(input.startAt));
  const end = new Date(String(input.endAt));

  if (!Number.isInteger(roomId)) throw new HttpError(422, 'roomId 格式錯誤');
  if (!title || title.length > 100) throw new HttpError(422, '會議名稱必填，且不能超過 100 字');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new HttpError(422, '開始或結束時間格式錯誤');
  }
  if (end <= start) throw new HttpError(422, '結束時間必須晚於開始時間');
  if (start <= new Date()) throw new HttpError(422, '不能預約過去的時間');

  const minutes = (end.getTime() - start.getTime()) / 60_000;
  const aligned = (d: Date) => d.getUTCMinutes() % SLOT_MINUTES === 0 && d.getUTCSeconds() === 0;
  if (!aligned(start) || !aligned(end)) throw new HttpError(422, `時間必須以 ${SLOT_MINUTES} 分鐘為單位`);
  if (minutes > MAX_DURATION_MINUTES) throw new HttpError(422, '單次預約最長 4 小時');

  return { roomId, title, start, end };
}

export async function findRoom(roomId: number): Promise<RoomRow | undefined> {
  const { rows } = await pool.query<RoomRow>('SELECT * FROM rooms WHERE id = $1', [roomId]);
  return rows[0];
}

export async function createBooking(userId: number, input: CreateBookingInput): Promise<BookingWithOrganizer> {
  const { roomId, title, start, end } = parseBookingInput(input);

  const room = await findRoom(roomId);
  if (!room) throw new HttpError(404, '找不到這間會議室');

  if (!isWithinBusinessHours(start, end)) {
    throw new HttpError(422, '只能預約營業時間 07:00–22:00 內的時段');
  }

  // 先撈出前後一天內的預約，再逐筆判斷是否重疊
  const { rows: nearby } = await pool.query<BookingRow>(
    `SELECT * FROM bookings
      WHERE room_id = $1
        AND cancelled_at IS NULL
        AND start_at BETWEEN $2::timestamptz - interval '1 day' AND $3::timestamptz + interval '1 day'`,
    [roomId, start, end],
  );
  if (nearby.some((b) => isOverlapping(start, end, b.start_at, b.end_at))) {
    throw new HttpError(409, '這個時段已經有人預約了');
  }

  const { rows } = await pool.query<BookingWithOrganizer>(
    `WITH inserted AS (
       INSERT INTO bookings (room_id, user_id, title, start_at, end_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *
     )
     SELECT inserted.*, u.name AS organizer_name
       FROM inserted
       JOIN users u ON u.id = inserted.user_id`,
    [roomId, userId, title, start, end],
  );
  return rows[0];
}

export async function cancelBooking(bookingId: number): Promise<void> {
  const { rows } = await pool.query<BookingRow>('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  const booking = rows[0];
  if (!booking || booking.cancelled_at) throw new HttpError(404, '找不到這筆預約');
  if (booking.start_at <= new Date()) throw new HttpError(422, '會議已經開始，無法取消');

  await pool.query('UPDATE bookings SET cancelled_at = now() WHERE id = $1', [bookingId]);
}

export interface BookingWithOrganizer extends BookingRow {
  organizer_name: string;
}

export async function listRoomBookings(roomId: number, from: Date, to: Date): Promise<BookingWithOrganizer[]> {
  const { rows } = await pool.query<BookingWithOrganizer>(
    `SELECT b.*, u.name AS organizer_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
      WHERE b.room_id = $1
        AND b.cancelled_at IS NULL
        AND b.start_at < $3
        AND b.end_at > $2
      ORDER BY b.start_at`,
    [roomId, from, to],
  );
  return rows;
}

export async function listUpcomingBookingsOf(userId: number): Promise<BookingWithOrganizer[]> {
  const { rows } = await pool.query<BookingWithOrganizer>(
    `SELECT b.*, u.name AS organizer_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
      WHERE b.user_id = $1
        AND b.cancelled_at IS NULL
        AND b.end_at > now()
      ORDER BY b.start_at`,
    [userId],
  );
  return rows;
}

export function toBookingDto(b: BookingRow & { organizer_name?: string }) {
  return {
    id: b.id,
    roomId: b.room_id,
    title: b.title,
    startAt: b.start_at.toISOString(),
    endAt: b.end_at.toISOString(),
    organizer: { id: b.user_id, name: b.organizer_name ?? null },
  };
}

/**
 * ⚠️ 財務部的計費系統每月 1 號會呼叫 GET /api/internal/billing-export 匯入這份資料，
 * 用來把會議室費用分攤到各部門。欄位名稱、型別、時間格式都不能更動，
 * 否則當月計費會整批匯入失敗。要改請先找財務部（見 CONTRIBUTING.md「對外介面」）。
 */
export function formatForBilling(booking: BookingRow, room: RoomRow) {
  return {
    booking_id: booking.id,
    room_code: `R${String(room.id).padStart(3, '0')}`,
    user_id: booking.user_id,
    start_time: toTaipeiDateTime(booking.start_at), // 例：2026-11-16 09:00（一律用台北時間）
    duration_min: Math.round((booking.end_at.getTime() - booking.start_at.getTime()) / 60_000),
  };
}

function toTaipeiDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

export async function listBillableBookings(month: string): Promise<Array<{ booking: BookingRow; room: RoomRow }>> {
  const from = new Date(`${month}-01T00:00:00+08:00`);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);

  const { rows } = await pool.query<BookingRow & { room_name: string; capacity: number; location: string; timezone: string }>(
    `SELECT b.*, r.name AS room_name, r.capacity, r.location, r.timezone
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
      WHERE b.cancelled_at IS NULL
        AND b.start_at >= $1
        AND b.start_at < $2
      ORDER BY b.id`,
    [from, to],
  );
  return rows.map((r) => ({
    booking: r,
    room: { id: r.room_id, name: r.room_name, capacity: r.capacity, location: r.location, timezone: r.timezone },
  }));
}
