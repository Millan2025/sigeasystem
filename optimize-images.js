const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const images = ['Tienda', 'Panaderia', 'Restaurante', 'Ferreteria'];

images.forEach(name => {
  const input = `public/${name}.png`;
  const output = `public/${name}-opt.jpg`;
  
  sharp(input)
    .resize(600, 400, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(output)
    .then(() => console.log(`✅ ${name} optimizada`))
    .catch(err => console.error(`❌ ${name}:`, err));
});
