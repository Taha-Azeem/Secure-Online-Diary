const CryptoJS = require('crypto-js');

const EncryptionService = {
  generateSalt: () => {
    return CryptoJS.lib.WordArray.random(128 / 8);
  },

  generateIv: () => {
    return CryptoJS.lib.WordArray.random(128 / 8);
  },

  encrypt: (data, keyPhrase, salt, iv) => {
    try {
      const derivedKey = CryptoJS.PBKDF2(keyPhrase, salt, {
        keySize: 256 / 32,
        iterations: 100
      });
      const encrypted = CryptoJS.AES.encrypt(data, derivedKey, { iv: iv });
      return encrypted.toString(); // Standard base64 formatting
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  },

  decrypt: (ciphertext, keyPhrase, saltHex, ivHex) => {
    try {
      if (!ciphertext || !keyPhrase || !saltHex || !ivHex) return '';
      const salt = CryptoJS.enc.Hex.parse(saltHex);
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const derivedKey = CryptoJS.PBKDF2(keyPhrase, salt, {
        keySize: 256 / 32,
        iterations: 100
      });
      const decrypted = CryptoJS.AES.decrypt(
        ciphertext,
        derivedKey,
        { iv: iv }
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }
};

const plaintext = "Hello World! This is a test.";
const key = "mysecretpassphrase";

const salt = EncryptionService.generateSalt();
const iv = EncryptionService.generateIv();

const encrypted = EncryptionService.encrypt(plaintext, key, salt, iv);
console.log("Encrypted (Base64):", encrypted);

const saltHex = salt.toString(CryptoJS.enc.Hex);
const ivHex = iv.toString(CryptoJS.enc.Hex);
console.log("Salt (Hex):", saltHex);
console.log("IV (Hex):", ivHex);

const decrypted = EncryptionService.decrypt(encrypted, key, saltHex, ivHex);
console.log("Decrypted:", decrypted);

if (decrypted === plaintext) {
  console.log("SUCCESS: Decryption matches plaintext!");
} else {
  console.log("FAIL: Decryption does not match!");
}
