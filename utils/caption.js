export const escapeMarkdownV2 = (text) => text?.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1') || '';

export const getProductCaption = (product) => {
  return `
⚡ *${escapeMarkdownV2(product.name)} ${escapeMarkdownV2(product.code || '')}*
💰 *قیمت*: ${product.price_customer?.toLocaleString() || 0} تومان
📏 *ابعاد*: ${product.length}×${product.width}×${product.height} سانتی‌متر
⚖️ *وزن*: ${product.weight || 0} کیلوگرم
📝 ${escapeMarkdownV2(product.description || 'بدون توضیح')}

🏢 نمایندگی رسمی Hinorms در ایران
🌐 Kasraeminence.com
`;
};
