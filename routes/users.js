import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// بروزرسانی نام کاربری و رمز عبور
router.patch('/:id/credentials', async (req, res) => {
  const { id } = req.params;
  const { username, currentPassword, newPassword } = req.body;

  try {
    // چک کردن وجود کاربر
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    const user = result.rows[0];

    // اگر قصد تغییر رمز عبور داریم، پس باید رمز فعلی صحیح باشه
    if (newPassword && currentPassword !== user.password) {
      return res.status(400).json({ error: 'رمز عبور فعلی نادرست است' });
    }

    const updatedUsername = username || user.username;
    const updatedPassword = newPassword || user.password;

    const updateResult = await query(
      `UPDATE users SET username = $1, password = $2 WHERE id = $3 RETURNING id, username`,
      [updatedUsername, updatedPassword, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('خطا در بروزرسانی اطلاعات کاربر:', error);
    res.status(500).json({ error: 'خطای سرور' });
  }
});

export default router;
