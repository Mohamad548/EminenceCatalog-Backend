import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// تنظیم CORS یک بار کافی است
app.use(cors({
  origin: '*', // در حالت production بهتره دامنه فرانت رو جایگزین کنی
}));

// فقط برای تست سرور
app.get('/', (req, res) => {
  res.send('✅ Backend API for Eminence Catalog is running.');
});

// استاتیک برای تصاویر
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middleware برای JSON
app.use(express.json());

// تعریف روت‌های اصلی
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);

// اجرای سرور فقط در محیط لوکال (برای Vercel لازم نیست)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

export default app;
