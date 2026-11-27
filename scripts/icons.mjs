// Rasterise public/favicon.svg into the PNG set and a multi-size favicon.ico.
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile('public/favicon.svg');
const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

const sizes = [16, 32, 180, 192, 512];
const buffers = Object.fromEntries(await Promise.all(sizes.map(async (size) => [size, await png(size)])));

await writeFile('public/favicon-16x16.png', buffers[16]);
await writeFile('public/favicon-32x32.png', buffers[32]);
await writeFile('public/favicon-32.png', buffers[32]);
await writeFile('public/apple-touch-icon.png', buffers[180]);
await writeFile('public/favicon-192.png', buffers[192]);
await writeFile('public/favicon-512.png', buffers[512]);

const icoImages = [16, 32].map((size) => ({ size, png: buffers[size] }));
const header = Buffer.alloc(6 + icoImages.length * 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoImages.length, 4);
let offset = header.length;
const parts = [header];
icoImages.forEach((img, i) => {
  const o = 6 + i * 16;
  header.writeUInt8(img.size, o);
  header.writeUInt8(img.size, o + 1);
  header.writeUInt16LE(1, o + 4);
  header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(img.png.length, o + 8);
  header.writeUInt32LE(offset, o + 12);
  offset += img.png.length;
  parts.push(img.png);
});
await writeFile('public/favicon.ico', Buffer.concat(parts));
console.log('icons ok');
