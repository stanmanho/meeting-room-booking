import type { Booking, Room, User } from './types';

let token: string | null = null;

export function setToken(value: string | null) {
  token = value;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  // 很多同事用手機瀏覽器，網路不穩（電梯、地下室）時自動重試一次
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    res = await fetch(path, init);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `連線錯誤（${res.status}）`);
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/api/login', { email, password }),
  rooms: () => request<Room[]>('GET', '/api/rooms'),
  roomBookings: (roomId: number) => request<Booking[]>('GET', `/api/rooms/${roomId}/bookings`),
  myBookings: () => request<Booking[]>('GET', '/api/bookings/mine'),
  createBooking: (input: { roomId: number; title: string; startAt: string; endAt: string }) =>
    request<Booking>('POST', '/api/bookings', input),
  cancelBooking: (id: number) => request<void>('DELETE', `/api/bookings/${id}`),
};
