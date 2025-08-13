import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../cloudinaryConfig.js';
import { query } from '../db.js';
import { sendToTelegram, editTelegramMessage, deleteTelegramMessage } from '../utils/telegram.js';


const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'products', allowed_formats: ['jpg', 'png', 'jpeg'] }
});
const upload = multer({ storage });

// GET همه محصولات
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET محصول با id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST اضافه کردن محصول و ارسال تلگرام
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const { name, code, categoryId, price_customer, description, length, width, height, weight } = req.body;

    if (!name || !code || !categoryId) return res.status(400).json({ error: 'فیلدهای ضروری ارسال نشده‌اند' });

    const existing = await query('SELECT * FROM products WHERE name=$1 AND code=$2', [name, code]);
    if (existing.rows.length) return res.status(400).json({ error: 'محصول با همین نام و کد قبلاً اضافه شده است.' });

    const images = req.files ? req.files.map(f => f.path) : [];

    const result = await query(`
      INSERT INTO products 
      (name, code, category_id, price_customer, description, image, length, width, height, weight)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [name, code, categoryId, price_customer || 0, description || '', JSON.stringify(images),
        length || 0, width || 0, height || 0, weight || 0]);

    const newProduct = result.rows[0];
    const telegramMessageId = await sendToTelegram(newProduct);
    if (telegramMessageId) await query('UPDATE products SET telegram_message_id=$1 WHERE id=$2', [telegramMessageId, newProduct.id]);

    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PATCH ویرایش محصول
router.patch('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, categoryId, price_customer, description, length, width, height, weight, existingImages } = req.body;
    const productResult = await query('SELECT * FROM products WHERE id=$1', [id]);
    if (!productResult.rows.length) return res.status(404).json({ error: 'محصول یافت نشد' });

    const currentImages = [...(existingImages ? JSON.parse(existingImages) : []), ...(req.files ? req.files.map(f => f.path) : [])];

    const result = await query(`
      UPDATE products SET 
        name=$1, code=$2, category_id=$3, price_customer=$4, description=$5, image=$6,
        length=$7, width=$8, height=$9, weight=$10
      WHERE id=$11 RETURNING *
    `, [name, code, categoryId, price_customer || 0, description || '', JSON.stringify(currentImages),
        length || 0, width || 0, height || 0, weight || 0, id]);

    const updatedProduct = result.rows[0];
    if (updatedProduct.telegram_message_id) await editTelegramMessage(updatedProduct.telegram_message_id, updatedProduct);

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE محصول
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id=$1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'محصول یافت نشد' });

    const deletedProduct = result.rows[0];
    if (deletedProduct.telegram_message_id) await deleteTelegramMessage(deletedProduct.telegram_message_id);

    res.json({ message: 'محصول با موفقیت حذف شد' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
