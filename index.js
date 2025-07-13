import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import path from 'path';

dotenv.config();

const app = express();

// تنظیم CORS اینجا
app.use(cors({
  origin: '*' // یا اگر می‌خوای محدودش کنی به آدرس فرانت خودت: origin: 'https://your-frontend-domain.com'
}));
const PORT = process.env.PORT || 3001;
app.get('/', (req, res) => {
  res.send('Backend API for Eminence Catalog is running.');
});

app.use(cors());

// این خط باید قبل از روت‌ها باشه
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
