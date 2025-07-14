import express from 'express';
import { query } from '../db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Missing credentials' });

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    // فقط اطلاعات لازم را برگردان
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
