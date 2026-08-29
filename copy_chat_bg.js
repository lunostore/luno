const fs = require('fs');
const path = require('path');

const src = 'C:/Users/youse/.gemini/antigravity-ide/brain/9aec7e92-d7e4-481b-a56f-ba6b78e53dd4/chat_brand_bg_1788047288749.jpg';
const destDir = path.join(__dirname, 'public', 'images');
const dest = path.join(destDir, 'chat-bg.jpg');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log('Successfully copied chat-bg.jpg to public/images/chat-bg.jpg');
} catch (err) {
  console.error('Error copying chat background:', err);
}
