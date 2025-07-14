import express from 'express';
import { query } from '../db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// روت ویرایش کاربر
router.put('/user/:id', async (req, res) => {
  const userId = req.params.id;
  const { username, currentPassword, newPassword } = req.body;

  if (!username) return res.status(400).json({ error: 'Username is required' });

  try {
    // ابتدا اطلاعات کاربر را بگیریم
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // اگر کاربر قصد تغییر رمز دارد، اول رمز فعلی را چک کنیم
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required to change password' });

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Current password is incorrect' });

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE users SET username = $1, password = $2 WHERE id = $3',
        [username, hashedNewPassword, userId]
      );
    } else {
      // فقط ویرایش نام کاربری
      await query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
