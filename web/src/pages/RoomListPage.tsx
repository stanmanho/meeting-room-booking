import type { Room, User } from '../types';

export function RoomListPage({
  user,
  rooms,
  error,
  onSelectRoom,
  onOpenMine,
  onLogout,
}: {
  user: User;
  rooms: Room[];
  error: string | null;
  onSelectRoom: (room: Room) => void;
  onOpenMine: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="page">
      <h1>嗨，{user.name}</h1>
      {error && <p className="message error">{error}</p>}
      {rooms.map((room) => (
        <button key={room.id} className="card" onClick={() => onSelectRoom(room)}>
          <strong>{room.name}</strong>
          <span className="muted">
            {room.location}・{room.capacity} 人
          </span>
        </button>
      ))}
      <div className="row">
        <button className="btn secondary" onClick={onOpenMine}>
          我的預約
        </button>
        <button className="btn secondary" onClick={onLogout}>
          登出
        </button>
      </div>
    </div>
  );
}
