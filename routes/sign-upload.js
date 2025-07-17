import express from 'express';
const router = express.Router();

// نمونه روت برای تست
router.get('/', (req, res) => {
  res.json({ message: 'Sign-upload route is working.' });
});

export default router;
