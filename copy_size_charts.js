const fs = require('fs');
const path = require('path');

const src1 = path.join(__dirname, 'logo', 'next is yours nxt', '1.png');
const src2 = path.join(__dirname, 'logo', 'next is yours nxt', '2.png');
const botAvatarSrc = path.join(__dirname, 'logo', 'bot-avatar.png');

const dest1 = path.join(__dirname, 'public', 'size-chart-tshirt.png');
const dest2 = path.join(__dirname, 'public', 'size-chart-pants.png');
const botAvatarDestDir = path.join(__dirname, 'public', 'images');
const botAvatarDest = path.join(botAvatarDestDir, 'bot-avatar.png');

try {
  fs.copyFileSync(src1, dest1);
  console.log('Successfully copied size-chart-tshirt.png');
} catch (err) {
  console.error('Error copying tshirt size chart:', err);
}

try {
  fs.copyFileSync(src2, dest2);
  console.log('Successfully copied size-chart-pants.png');
} catch (err) {
  console.error('Error copying pants size chart:', err);
}

try {
  if (fs.existsSync(botAvatarSrc)) {
    if (!fs.existsSync(botAvatarDestDir)) {
      fs.mkdirSync(botAvatarDestDir, { recursive: true });
    }
    fs.copyFileSync(botAvatarSrc, botAvatarDest);
    console.log('Successfully copied bot-avatar.png');
  }
} catch (err) {
  console.error('Error copying bot avatar:', err);
}
