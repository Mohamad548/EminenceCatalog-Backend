import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config(); // Load env variables

const { TELEGRAM_TOKEN, CHAT_ID, PRODUCT_PAGE_BASE } = process.env;

if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.warn('Telegram token or chat ID is missing in env!');
}

// Escape characters for MarkdownV2
export const escapeMarkdownV2 = (text) =>
  text?.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1') || '';

// Build caption for a product
export const buildCaption = (product) => {
  const name = escapeMarkdownV2(product.name);
  const code = escapeMarkdownV2(product.code);
  const description = escapeMarkdownV2(product.description || 'بدون توضیح');

  return `
⚡ *${name}*
🔹 *کد*: \`${code}\`
💰 *قیمت*: ${product.price_customer?.toLocaleString() || 0} تومان
📏 *ابعاد*: ${product.length || 0}×${product.width || 0}×${product.height || 0} سانتی‌متر
⚖️ *وزن*: ${product.weight || 0} کیلوگرم
📂 *دسته‌بندی*: ${escapeMarkdownV2(product.category_name || '')}
📝 ${description}
🏢 نمایندگی رسمی Hinorms در ایران
🌐 سایت: Kasraeminence.com
🔗 [مشاهده محصول](${PRODUCT_PAGE_BASE}${product.id})
`;
};

// Send a photo to Telegram
export const sendToTelegram = async (product) => {
  try {
    const caption = buildCaption(product);

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💬 واتساپ', url: 'https://wa.me/+989122434557' },
          { text: '🟣 اینستاگرام', url: 'https://www.instagram.com/Hinorms.ir' },
        ],
        [
          { text: '🤖 سوالات متداول', url: 'https://t.me/HinormsFAQ_Bot' },
          { text: '🆘 پشتیبانی', url: 'https://t.me/HinormsSupport_Bot' },
        ],
      ],
    };

    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
      chat_id: CHAT_ID,
      photo: product.image?.[0] || 'https://via.placeholder.com/300x300.png?text=No+Image',
      caption,
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard,
    });

    return response.data.result.message_id;
  } catch (err) {
    console.error('Failed to send product to Telegram:', err.response?.data || err.message);
    return null;
  }
};

// Edit an existing Telegram message
export const editTelegramMessage = async (messageId, product) => {
  if (!messageId) return null;
  try {
    const caption = buildCaption(product);
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageCaption`, {
      chat_id: CHAT_ID,
      message_id: messageId,
      caption,
      parse_mode: 'MarkdownV2',
    });
  } catch (err) {
    console.error('Failed to edit Telegram message:', err.response?.data || err.message);
  }
};

// Delete a Telegram message
export const deleteTelegramMessage = async (messageId) => {
  if (!messageId) return null;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteMessage`, {
      chat_id: CHAT_ID,
      message_id: messageId,
    });
  } catch (err) {
    console.error('Failed to delete Telegram message:', err.response?.data || err.message);
  }
};
