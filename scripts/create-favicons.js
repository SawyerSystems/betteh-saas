import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple script to copy the icon files to the expected favicon locations
// This is a temporary solution until proper image resizing can be implemented

const sourceDir = path.join(__dirname, '../client/public/icons');
const targetDir = path.join(__dirname, '../client/public/icons');

// Copy icon-192.png to favicon-32x32.png and favicon-16x16.png
// In a real implementation, these would be properly resized
const source192 = path.join(sourceDir, 'icon-192.png');
const favicon32 = path.join(targetDir, 'favicon-32x32.png');
const favicon16 = path.join(targetDir, 'favicon-16x16.png');

try {
  if (fs.existsSync(source192)) {
    fs.copyFileSync(source192, favicon32);
    fs.copyFileSync(source192, favicon16);
    console.log('Created favicon-32x32.png and favicon-16x16.png');
  } else {
    console.error('Source icon-192.png not found');
  }
} catch (error) {
  console.error('Error creating favicon files:', error);
}
