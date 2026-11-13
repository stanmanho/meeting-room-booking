import { Router } from 'express';
import { signToken, verifyPassword, type AuthUser } from '../auth.js';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(422, '請輸入 email 與密碼');
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new HttpError(401, 'email 或密碼錯誤');
  }

  const authUser: AuthUser = { id: user.id, role: user.role };
  res.json({
    token: signToken(authUser),
    user: { id: user.id, name: user.name, role: user.role },
  });
});
