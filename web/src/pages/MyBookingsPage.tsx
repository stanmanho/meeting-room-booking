import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { dateKey, formatDateLabel, formatTime } from '../time';
import type { Booking, Room } from '../types';

export function MyBookingsPage({ rooms, onBack }: { rooms: Room[]; onBack: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .myBookings()
      .then(setBookings)
      .catch((e) => setError(e instanceof ApiError ? e.message : '無法載入預約'));
  }, []);

  useEffect(load, [load]);

  async function cancel(id: number) {
    if (!window.confirm('確定要取消這筆預約嗎？')) return;
    setError(null);
    try {
      await api.cancelBooking(id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '取消失敗，請稍後再試');
    }
  }

  return (
    <div className="page">
      <button className="link" onClick={onBack}>
        ‹ 返回
      </button>
      <h1>我的預約</h1>
      {error && <p className="message error">{error}</p>}
      {bookings.length === 0 && <p className="muted">目前沒有預約</p>}
      {bookings.map((b) => {
        const room = rooms.find((r) => r.id === b.roomId);
        return (
          <div key={b.id} className="card">
            <strong>{b.title}</strong>
            <span>
              {room?.name}（{room?.location}）
            </span>
            <span className="muted">
              {formatDateLabel(dateKey(b.startAt))} {formatTime(b.startAt)}–{formatTime(b.endAt)}
            </span>
            <div>
              <button className="btn secondary" onClick={() => cancel(b.id)}>
                取消預約
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
