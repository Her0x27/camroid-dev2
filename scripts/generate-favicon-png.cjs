const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../client/public/favicon.svg');
const pngPath = path.join(__dirname, '../client/public/favicon.png');

const svgContent = fs.readFileSync(svgPath, 'utf8');

sharp(Buffer.from(svgContent))
  .resize(192, 192)
  .png()
  .toFile(pngPath)
  .then(() => console.log('PNG favicon created: 192x192'))
  .catch(err => console.error('Error:', err));
