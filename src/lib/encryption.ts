import CryptoJS from 'crypto-js';

/**
 * AES-256 Encryption Utility
 * Provides methods to encrypt and decrypt data using a master key.
 */
export const EncryptionService = {
  /**
   * Encrypts a string using AES-256.
   * @param data The plaintext data to encrypt.
   * @param key The master key for encryption.
   * @returns The encrypted ciphertext.
   */
  encrypt: (data: string, key: string): string => {
    try {
      return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  },

  /**
   * Decrypts a ciphertext using AES-256.
   * @param ciphertext The encrypted data to decrypt.
   * @param key The master key for decryption.
   * @returns The decrypted plaintext.
   */
  decrypt: (ciphertext: string, key: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  },

  /**
   * Generates a random salt or IV if needed for manual implementation,
   * though CryptoJS handles it internally with its password-based API.
   */
  generateKey: () => {
    return CryptoJS.lib.WordArray.random(32).toString();
  }
};
