import { Router } from 'express';
import { currentUser } from '../auth.js';
import { cancelBooking, createBooking, listUpcomingBookingsOf, toBookingDto } from '../services/bookingService.js';

export const bookingsRouter = Router();

bookingsRouter.get('/mine', async (req, res) => {
  const bookings = await listUpcomingBookingsOf(currentUser(req).id);
  res.json(bookings.map(toBookingDto));
});

bookingsRouter.post('/', async (req, res) => {
  const booking = await createBooking(currentUser(req).id, req.body ?? {});
  res.status(201).json(toBookingDto(booking));
});

bookingsRouter.delete('/:id', async (req, res) => {
  await cancelBooking(Number(req.params.id));
  res.status(204).end();
});
