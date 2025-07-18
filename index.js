///index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import usersRouter from './routes/users.js';
import signUploadRoute from './routes/sign-upload.js';
import path from 'path';

dotenv.config();

const app = express();

app.use(cors()); // این یعنی همه مجازن
const PORT = process.env.PORT || 3001;
app.get('/', (req, res) => {
  res.send('Backend API for Eminence Catalog is running.');
});

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/sign-upload', signUploadRoute);
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
