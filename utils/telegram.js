import axios from 'axios';
import { getProductKeyboard } from './keyboard.js';
import { getProductCaption } from './caption.js';
require("dotenv").config();
// ارسال پیام
export const sendToTelegram = async (product) => {
  const { TELEGRAM_TOKEN, CHAT_ID, PRODUCT_PAGE_BASE } = process.env;
  if (!TELEGRAM_TOKEN || !CHAT_ID) return null;

  const caption = getProductCaption(product);
  const keyboard = getProductKeyboard();

  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
      {
        chat_id: CHAT_ID,
        photo: product.image?.[0] || 'https://via.placeholder.com/300x300.png?text=No+Image',
        caption,
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard
      }
    );
    return res.data.result.message_id;
  } catch (err) {
    console.error('Failed to send product to Telegram:', err.response?.data || err.message);
    return null;
  }
};

// ویرایش پیام
export const editTelegramMessage = async (messageId, product) => {
  const { TELEGRAM_TOKEN, CHAT_ID, PRODUCT_PAGE_BASE } = process.env;
  if (!TELEGRAM_TOKEN || !CHAT_ID || !messageId) return;

  const caption = `
⚡ *${product.name}*
${getProductCaption(product)}
`;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageCaption`, {
      chat_id: CHAT_ID,
      message_id: messageId,
      caption,
      parse_mode: 'MarkdownV2'
    });
  } catch (err) {
    console.error('Failed to edit Telegram message:', err.message);
  }
};

// حذف پیام
export const deleteTelegramMessage = async (messageId) => {
  const { TELEGRAM_TOKEN, CHAT_ID } = process.env;
  if (!TELEGRAM_TOKEN || !CHAT_ID || !messageId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteMessage`, {
      chat_id: CHAT_ID,
      message_id: messageId
    });
  } catch (err) {
    console.error('Failed to delete Telegram message:', err.message);
  }
};
