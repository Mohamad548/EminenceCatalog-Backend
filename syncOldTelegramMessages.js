// syncOldTelegramMessages.js
import fs from 'fs';
import { query } from './db.js'; // مسیر فایل db.js خودت

const SENT_PRODUCTS_FILE = 'sent_products.json'; // فایل قدیمی که message_id ها داخلش هست

const syncOldTelegramMessages = async () => {
  if (!fs.existsSync(SENT_PRODUCTS_FILE)) {
    console.log('❌ فایل sent_products.json پیدا نشد.');
    return;
  }

  const sentProducts = JSON.parse(fs.readFileSync(SENT_PRODUCTS_FILE, 'utf8'));

  for (const item of sentProducts) {
    const { productId, messageId } = item;
    if (!productId || !messageId) continue;

    try {
      await query(
        'UPDATE products SET telegram_message_id=$1 WHERE id=$2',
        [messageId, productId]
      );
      console.log(`✅ محصول ${productId} به‌روز شد (message_id: ${messageId})`);
    } catch (err) {
      console.error(`❌ خطا در محصول ${productId}:`, err.message);
    }
  }

  console.log('🎉 همگام‌سازی پیام‌های قدیمی تلگرام با دیتابیس کامل شد!');
};

syncOldTelegramMessages();
