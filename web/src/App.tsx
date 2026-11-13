import { useEffect, useState } from 'react';
import { api, ApiError, setToken } from './api';
import { LoginPage } from './pages/LoginPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { RoomListPage } from './pages/RoomListPage';
import { RoomPage } from './pages/RoomPage';
import type { Room, User } from './types';

type Route = { name: 'rooms' } | { name: 'room'; room: Room } | { name: 'mine' };

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<Route>({ name: 'rooms' });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .rooms()
      .then(setRooms)
      .catch((e) => setRoomsError(e instanceof ApiError ? e.message : '無法載入會議室'));
  }, [user]);

  function logout() {
    setToken(null);
    setUser(null);
    setRoute({ name: 'rooms' });
  }

  if (!user) return <LoginPage onLogin={setUser} />;

  const backToRooms = () => setRoute({ name: 'rooms' });
  switch (route.name) {
    case 'room':
      return <RoomPage room={route.room} onBack={backToRooms} />;
    case 'mine':
      return <MyBookingsPage rooms={rooms} onBack={backToRooms} />;
    default:
      return (
        <RoomListPage
          user={user}
          rooms={rooms}
          error={roomsError}
          onSelectRoom={(room) => setRoute({ name: 'room', room })}
          onOpenMine={() => setRoute({ name: 'mine' })}
          onLogout={logout}
        />
      );
  }
}
