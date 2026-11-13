import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api';
import { dateKey, formatDateLabel, formatTime, toIso, upcomingDays } from '../time';
import type { Booking, Room } from '../types';

export function RoomPage({ room, onBack }: { room: Room; onBack: () => void }) {
  const days = useMemo(() => upcomingDays(7), []);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState(days[0]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    api
      .roomBookings(room.id)
      .then(setBookings)
      .catch((e) => setMessage({ type: 'error', text: e instanceof ApiError ? e.message : '無法載入預約' }));
  }, [room.id]);

  useEffect(load, [load]);

  async function submit() {
    setMessage(null);
    try {
      await api.createBooking({ roomId: room.id, title, startAt: toIso(date, start), endAt: toIso(date, end) });
      setMessage({ type: 'success', text: '預約成功！' });
      setTitle('');
      load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof ApiError ? e.message : '發生錯誤，請稍後再試' });
    }
  }

  const byDay = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = dateKey(b.startAt);
    byDay.set(key, [...(byDay.get(key) ?? []), b]);
  }

  return (
    <div className="page">
      <button className="link" onClick={onBack}>
        ‹ 返回
      </button>
      <h1>
        {room.name}（{room.location}）
      </h1>

      <h2>接下來 7 天</h2>
      {days.map((day) => (
        <div key={day} className="card">
          <strong>{formatDateLabel(day)}</strong>
          {(byDay.get(day) ?? []).map((b) => (
            <span key={b.id}>
              {formatTime(b.startAt)}–{formatTime(b.endAt)}　{b.title}（{b.organizer.name}）
            </span>
          ))}
          {!byDay.get(day) && <span className="muted">沒有預約</span>}
        </div>
      ))}

      <h2>新增預約</h2>
      <div className="card">
        <div className="row">
          {days.map((day) => (
            <button key={day} className={`chip ${day === date ? 'active' : ''}`} onClick={() => setDate(day)}>
              {formatDateLabel(day)}
            </button>
          ))}
        </div>
        <div className="row">
          <input type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
          到
          <input type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <input placeholder="會議名稱" value={title} onChange={(e) => setTitle(e.target.value)} />
        {message && <p className={`message ${message.type}`}>{message.text}</p>}
        <button className="btn" onClick={submit}>
          預約
        </button>
      </div>
    </div>
  );
}
