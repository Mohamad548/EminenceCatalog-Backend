import express from 'express';
import multer from 'multer';
import { query } from '../db.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../cloudinaryConfig.js';
import axios from 'axios';

const router = express.Router();

// تنظیم ذخیره فایل تصویر در Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

// ---------------------------------------------
// توابع تلگرام
// ---------------------------------------------
const sendToTelegram = async (product) => {
const shortDescription = product.description || "بدون توضیح";
  const caption = `
⚡ *${product.name} ${product.code}*
💰 *قیمت*: ${product.price_customer?.toLocaleString() || 0} تومان
📏 *ابعاد*: ${product.length}×${product.width}×${product.height} سانتی‌متر
⚖️ *وزن*: ${product.weight || 0} کیلوگرم
📝 ${shortDescription}

🏢 نمایندگی رسمی Hinorms در ایران
🌐 سایت: Kasraeminence.com
  `;

const keyboard = {
  inline_keyboard: [
    [
      { text: "💬 واتساپ", url: "https://wa.me/+989122434557" },
      { text: "🟣 اینستاگرام", url: "https://www.instagram.com/Hinorms.ir" }
    ],
    [
      { text: "🤖 سوالات متداول", url: "https://t.me/HinormsFAQ_Bot" },
      { text: "🆘 پشتیبانی", url: "https://t.me/HinormsSupport_Bot" }
    ]
  ]
};


  const res = await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
    {
      chat_id: CHAT_ID,
      photo: product.image?.[0] || "https://www.kasraeminence.com/wp-content/uploads/2024/12/2.png",
      caption,
      parse_mode: "Markdown",
      reply_markup: keyboard
    }
  );

  return res.data.result.message_id;
};


const editTelegramMessage = async (messageId, product) => {
  const { TELEGRAM_TOKEN, CHAT_ID, PRODUCT_PAGE_BASE } = process.env;
  if (!TELEGRAM_TOKEN || !CHAT_ID || !messageId) return;

const shortDescription = product.description || "بدون توضیح";
  const caption = `
⚡ *${product.name} ${product.code}*
💰 *قیمت*: ${product.price_customer?.toLocaleString() || 0} تومان
📏 *ابعاد*: ${product.length}×${product.width}×${product.height} سانتی‌متر
⚖️ *وزن*: ${product.weight || 0} کیلوگرم
📝 ${shortDescription}

🏢 نمایندگی رسمی Hinorms در ایران
🌐 سایت: Kasraeminence.com
  `;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageCaption`, {
      chat_id: CHAT_ID,
      message_id: messageId,
      caption,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Failed to edit Telegram message:', err.message);
  }
};

const deleteTelegramMessage = async (messageId) => {
  const { TELEGRAM_TOKEN, CHAT_ID } = process.env;
  if (!TELEGRAM_TOKEN || !CHAT_ID || !messageId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteMessage`, {
      chat_id: CHAT_ID,
      message_id: messageId,
    });
  } catch (err) {
    console.error('Failed to delete Telegram message:', err.message);
  }
};

// ---------------------------------------------
// روت‌ها
// ---------------------------------------------
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

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to get product by ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------
// POST: اضافه کردن محصول و ارسال به تلگرام
// ---------------------------------------------
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const { name, code, categoryId, price_customer, description, length, width, height, weight } = req.body;

    if (!name || !code || !categoryId) {
      return res.status(400).json({ error: 'فیلدهای ضروری ارسال نشده‌اند' });
    }

    const existing = await query('SELECT * FROM products WHERE name=$1 AND code=$2', [name, code]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'محصول با همین نام و کد قبلاً اضافه شده است.' });

    const imageArray = req.files ? req.files.map(file => file.path) : [];

    const result = await query(`
      INSERT INTO products 
      (name, code, category_id, price_customer, description, image, length, width, height, weight)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [name, code, categoryId, price_customer || 0, description || '', JSON.stringify(imageArray), length || 0, width || 0, height || 0, weight || 0]);

    const newProduct = result.rows[0];

    // ارسال به تلگرام و ذخیره message_id
    const telegramMessageId = await sendToTelegram(newProduct);
    if (telegramMessageId) {
      await query('UPDATE products SET telegram_message_id=$1 WHERE id=$2', [telegramMessageId, newProduct.id]);
      newProduct.telegram_message_id = telegramMessageId;
    }

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Failed to add product:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ---------------------------------------------
// PATCH: ویرایش محصول و بروزرسانی تلگرام
// ---------------------------------------------
router.patch('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) return res.status(400).json({ error: 'Invalid product ID' });

    const { name, code, categoryId, price_customer, description, length, width, height, weight, existingImages } = req.body;

    const productResult = await query('SELECT * FROM products WHERE id=$1', [idNumber]);
    if (productResult.rows.length === 0) return res.status(404).json({ error: 'محصول یافت نشد' });

    const existing = await query('SELECT * FROM products WHERE name=$1 AND code=$2 AND id<>$3', [name, code, idNumber]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'محصول با همین نام و کد قبلاً وجود دارد.' });

    let parsedExistingImages = [];
    try { parsedExistingImages = existingImages ? JSON.parse(existingImages) : []; } catch { parsedExistingImages = []; }

    const newUploadedImages = req.files ? req.files.map(file => file.path) : [];
    const currentImages = [...parsedExistingImages, ...newUploadedImages];

    const result = await query(`
      UPDATE products SET 
        name=$1, code=$2, category_id=$3, price_customer=$4, description=$5, image=$6,
        length=$7, width=$8, height=$9, weight=$10
      WHERE id=$11 RETURNING *
    `, [name, code, categoryId, price_customer || 0, description || '', JSON.stringify(currentImages),
        length || 0, width || 0, height || 0, weight || 0, idNumber]);

    const updatedProduct = result.rows[0];

    // ویرایش پیام تلگرام
    if (updatedProduct.telegram_message_id) {
      await editTelegramMessage(updatedProduct.telegram_message_id, updatedProduct);
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------
// DELETE: حذف محصول و پیام تلگرام
// ---------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) return res.status(400).json({ error: 'Invalid product ID' });

    const result = await query('DELETE FROM products WHERE id=$1 RETURNING *', [idNumber]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'محصول یافت نشد' });

    const deletedProduct = result.rows[0];

    if (deletedProduct.telegram_message_id) {
      await deleteTelegramMessage(deletedProduct.telegram_message_id);
    }

    res.json({ message: 'محصول با موفقیت حذف شد' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;