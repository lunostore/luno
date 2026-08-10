const fs = require('fs');
const path = require('path');

const src = 'C:/Users/youse/.gemini/antigravity-ide/brain/21686c93-ce8b-4042-b114-21e5534f454f/ai_bot_avatar_1786329369069.png';
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
