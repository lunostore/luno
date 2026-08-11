const fs = require('fs');
const path = require('path');

const src = 'C:/Users/youse/.gemini/antigravity-ide/brain/d01785b9-88f0-4733-b72f-188ac34e9da3/bot_avatar_1786486854873.png';
const destDir = path.join(__dirname, 'public', 'images');
const dest = path.join(destDir, 'bot-avatar.png');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log('Successfully copied bot-avatar.png to public/images/bot-avatar.png');
} catch (err) {
  console.error('Error copying bot avatar:', err);
}
