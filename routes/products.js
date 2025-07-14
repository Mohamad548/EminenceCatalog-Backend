// routes/products.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db.js';

const router = express.Router();

// 📁 تنظیم ذخیره فایل تصویر
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // مسیر ذخیره عکس
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// 🟢 GET همه محصولات
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to get products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🟢 GET یک محصول خاص با id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT * FROM products WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to get product by ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🟡 POST ایجاد محصول جدید
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, code, categoryId, price1, price2, priceCustomer, description } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !code || !categoryId) {
      return res.status(400).json({ error: 'فیلدهای ضروری ارسال نشده‌اند' });
    }

    const result = await query(`
      INSERT INTO products (name, code, category_id, price1, price2, price_customer, description, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, code, categoryId, price1 || 0, price2 || 0, priceCustomer || 0, description || '', image]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🟠 PATCH ویرایش محصول
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, categoryId, price1, price2, priceCustomer, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const productResult = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'محصول یافت نشد' });
    }

    const currentImage = image || productResult.rows[0].image;

    const result = await query(`
      UPDATE products SET name=$1, code=$2, category_id=$3, price1=$4, price2=$5, price_customer=$6, description=$7, image=$8
      WHERE id=$9 RETURNING *`,
      [name, code, categoryId, price1 || 0, price2 || 0, priceCustomer || 0, description || '', currentImage, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔴 DELETE حذف محصول
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'محصول یافت نشد' });
    }
    res.json({ message: 'محصول با موفقیت حذف شد' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;