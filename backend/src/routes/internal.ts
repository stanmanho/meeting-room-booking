import { Router } from 'express';
import { HttpError } from '../errors.js';
import { formatForBilling, listBillableBookings } from '../services/bookingService.js';

export const internalRouter = Router();

// 財務部計費系統專用，格式說明見 formatForBilling()
internalRouter.get('/billing-export', async (req, res) => {
  const month = String(req.query.month ?? '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(422, 'month 格式為 YYYY-MM');

  const rows = await listBillableBookings(month);
  res.json(rows.map(({ booking, room }) => formatForBilling(booking, room)));
});
