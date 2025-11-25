const crypto = require('crypto-js');
require('dotenv').config();

const encryptionKey = process.env.ENCRYPTION_KEY || 'default-32-character-encryption-key!!';

function encrypt(text) {
  if (!text) return '';
  const encrypted = crypto.AES.encrypt(text, encryptionKey).toString();
  return encrypted;
}

function decrypt(encryptedText) {
  try {
    // Handle null, undefined, or empty strings
    if (!encryptedText || encryptedText === '' || encryptedText === 'null') {
      return '';
    }
    
    const bytes = crypto.AES.decrypt(encryptedText, encryptionKey);
    const decrypted = bytes.toString(crypto.enc.Utf8);
    return decrypted;
  } catch (error) {
    return ''; // Return empty string instead of throwing error
  }
}

module.exports = {
  encrypt,
  decrypt
};