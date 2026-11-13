export interface User {
  id: number;
  name: string;
  role: 'member' | 'admin';
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  timezone: string;
}

export interface Booking {
  id: number;
  roomId: number;
  title: string;
  startAt: string;
  endAt: string;
  organizer: { id: number; name: string };
}
