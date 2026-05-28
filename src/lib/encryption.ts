import CryptoJS from 'crypto-js';

/**
 * AES-256 Zero-Knowledge Encryption Service
 * Uses PBKDF2 for key derivation from a user's master passphrase,
 * utilizing random salts and IVs to ensure ciphertext security.
 */
export const EncryptionService = {
  /**
   * Generates a 128-bit random salt.
   */
  generateSalt: () => {
    return CryptoJS.lib.WordArray.random(128 / 8);
  },

  /**
   * Generates a 128-bit random IV.
   */
  generateIv: () => {
    return CryptoJS.lib.WordArray.random(128 / 8);
  },

  /**
   * Encrypts plaintext using AES-256 with PBKDF2 key derivation.
   * @param data The plaintext data to encrypt.
   * @param keyPhrase The user's master access key.
   * @param salt The WordArray salt.
   * @param iv The WordArray IV.
   * @returns Base64 encoded ciphertext.
   */
  encrypt: (data: string, keyPhrase: string, salt: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string => {
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

  /**
   * Decrypts ciphertext using AES-256 with PBKDF2 key derivation.
   * @param ciphertext Base64 encoded ciphertext.
   * @param keyPhrase The user's master access key.
   * @param saltHex Hex-encoded salt string.
   * @param ivHex Hex-encoded IV string.
   * @returns Decrypted UTF-8 plaintext.
   */
  decrypt: (ciphertext: string, keyPhrase: string, saltHex: string, ivHex: string): string => {
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
export default EncryptionService;
