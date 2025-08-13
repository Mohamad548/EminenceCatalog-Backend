import { query } from './db.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const { TELEGRAM_TOKEN, CHAT_ID, PRODUCT_PAGE_BASE } = process.env;

if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error('لطفاً TELEGRAM_TOKEN و CHAT_ID را در .env تنظیم کنید.');
  process.exit(1);
}

const sendToTelegram = async (product) => {
  const caption = `
⚡ *${product.name}*
🔹 *کد*: \`${product.code}\`
💰 *قیمت*: ${product.price_customer?.toLocaleString() || 0} تومان
📏 *ابعاد*: ${product.length}×${product.width}×${product.height} سانتی‌متر
⚖️ *وزن*: ${product.weight || 0} کیلوگرم
📂 *دسته‌بندی*: ${product.category_name || ''}
📝 ${product.description || ''}
🔗 [مشاهده محصول](${PRODUCT_PAGE_BASE}${product.id})
  `;
  try {
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
      chat_id: CHAT_ID,
      photo: product.image?.[0] || 'https://via.placeholder.com/300x300.png?text=No+Image',
      caption,
      parse_mode: 'Markdown',
    });
    return response.data.result.message_id;
  } catch (err) {
    console.error(`خطا در ارسال محصول ${product.id} به تلگرام:`, err.message);
    return null;
  }
};

const syncMessages = async () => {
  try {
    const result = await query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.telegram_message_id IS NULL
      ORDER BY p.id
    `);

    const products = result.rows;
    if (!products.length) {
      console.log('تمام محصولات قبلاً به تلگرام ارسال شده‌اند.');
      return;
    }

    for (const product of products) {
      console.log(`ارسال محصول ${product.id} به تلگرام...`);
      const messageId = await sendToTelegram(product);
      if (messageId) {
        await query('UPDATE products SET telegram_message_id=$1 WHERE id=$2', [messageId, product.id]);
        console.log(`محصول ${product.id} با موفقیت همگام‌سازی شد (message_id: ${messageId}).`);
      }
    }

    console.log('همگام‌سازی پیام‌های تلگرام تمام شد.');
  } catch (err) {
    console.error('خطا در همگام‌سازی پیام‌ها:', err.message);
  }
};

syncMessages();
