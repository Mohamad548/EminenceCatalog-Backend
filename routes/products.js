import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../cloudinaryConfig.js';

const router = express.Router();

// تنظیم ذخیره فایل تصویر
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // نام پوشه در Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

/* ----------------------------------------------------
 * GET: دریافت همه محصولات به همراه category_name
 * ---------------------------------------------------- */
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

/* ----------------------------------------------------
 * GET: دریافت یک محصول با id به همراه category_name
 * ---------------------------------------------------- */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
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

/* ----------------------------------------------------
 * POST: ایجاد محصول جدید با آپلود عکس
 * ---------------------------------------------------- */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      code,
      categoryId,
      priceCustomer,
      description,
      length,
      width,
      height,
      weight,
    } = req.body;

    const image = req.file ? req.file.path : null; // Cloudinary URL

    if (!name || !code || !categoryId) {
      return res.status(400).json({ error: 'فیلدهای ضروری ارسال نشده‌اند' });
    }

    const result = await query(`
      INSERT INTO products 
      (name, code, category_id, price_customer, description, image, length, width, height, weight)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        name,
        code,
        categoryId,
        priceCustomer || 0,
        description || '',
        image,
        length || 0,
        width || 0,
        height || 0,
        weight || 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add product:', error);
    res.status(500).json({
      error: error.message || 'Unknown error',
      stack: error.stack || null,
      details: error,
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
  }
});

/* ----------------------------------------------------
 * PATCH: ویرایش محصول با آپلود عکس
 * ---------------------------------------------------- */
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      categoryId,
      priceCustomer,
      description,
      length,
      width,
      height,
      weight,
    } = req.body;

    const image = req.file ? req.file.path : null; // Cloudinary URL

    const productResult = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'محصول یافت نشد' });
    }

    const currentImage = image || productResult.rows[0].image;

    const result = await query(`
      UPDATE products SET 
        name=$1, code=$2, category_id=$3, price_customer=$4, description=$5, image=$6,
        length=$7, width=$8, height=$9, weight=$10
      WHERE id=$11 RETURNING *
    `,
      [
        name,
        code,
        categoryId,
        priceCustomer || 0,
        description || '',
        currentImage,
        length || 0,
        width || 0,
        height || 0,
        weight || 0,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------------------------------------
 * DELETE: حذف محصول با id
 * ---------------------------------------------------- */
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
