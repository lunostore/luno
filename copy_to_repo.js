const fs = require('fs');
const path = require('path');

const src = 'C:/Users/youse/.gemini/antigravity-ide/brain/21686c93-ce8b-4042-b114-21e5534f454f/ai_bot_avatar_1786329369069.png';
const publicImgDir = path.join(__dirname, 'public', 'images');
const logoDir = path.join(__dirname, 'logo');
const destPublic = path.join(publicImgDir, 'bot-avatar.png');
const destLogo = path.join(logoDir, 'bot-avatar.png');
const tsFile = path.join(__dirname, 'lib', 'bot-avatar-data.ts');

if (!fs.existsSync(publicImgDir)) {
  fs.mkdirSync(publicImgDir, { recursive: true });
}
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// 1. Copy image to public/images/bot-avatar.png
fs.copyFileSync(src, destPublic);
console.log('Copied to public/images/bot-avatar.png');

// 2. Copy image to logo/bot-avatar.png
fs.copyFileSync(src, destLogo);
console.log('Copied to logo/bot-avatar.png');

// 3. Create TS Base64 file as 100% bulletproof fallback
const imageBuffer = fs.readFileSync(src);
const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
const tsContent = `export const BOT_AVATAR_BASE64 = "${base64Image}";\n`;
fs.writeFileSync(tsFile, tsContent);
console.log('Generated lib/bot-avatar-data.ts');
