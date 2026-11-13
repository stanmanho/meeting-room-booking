import cors from 'cors';
import express from 'express';
import { requireAdmin, requireAuth } from './auth.js';
import { errorHandler } from './errors.js';
import { authRouter } from './routes/auth.js';
import { bookingsRouter } from './routes/bookings.js';
import { internalRouter } from './routes/internal.js';
import { roomsRouter } from './routes/rooms.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', authRouter);
app.use('/api/rooms', requireAuth, roomsRouter);
app.use('/api/bookings', requireAuth, bookingsRouter);
app.use('/api/internal', requireAuth, requireAdmin, internalRouter);

app.use(errorHandler);
