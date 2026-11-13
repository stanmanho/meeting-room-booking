CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE bookings (
  id         SERIAL PRIMARY KEY,
  room_id    INT NOT NULL REFERENCES rooms(id),
  user_id    INT NOT NULL REFERENCES users(id),
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE INDEX bookings_room_start_idx ON bookings (room_id, start_at);
