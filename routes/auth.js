import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Missing credentials' });

  try {
    const result = await query(
      'SELECT id, username FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    res.json(user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
