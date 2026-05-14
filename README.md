# CipherDiary - Secure Online Diary System

## Project Overview
CipherDiary is an advanced Information Security project designed to provide total digital sovereignty for personal journaling. It features a Zero-Knowledge Architecture where data is encrypted using military-grade AES-256 before being stored in the cloud.

## Key Features
- **Zero-Knowledge Encryption:** Diary entries are encrypted/decrypted locally. Your master key never touches the server.
- **AES-256 Protocol:** Industry-standard encryption for entry titles and content.
- **Secure Authentication:** Firebase-powered identity management.
- **Admin Command Center:** Real-time monitoring of system integrity, activity logs, and security threats.
- **Bento-style UI:** A high-tech, responsive design with glassmorphism aesthetics.

## Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore)
- **Security:** Crypto-JS (AES-256 GCM)
- **Animations:** Motion (Framer Motion)
- **Icons:** Lucide React & Material Symbols

## Local Setup Instructions
1. **Clone the repository**
2. **Install Packages:**
   ```bash
   npm install
   ```
3. **Configure Firebase:**
   Set up a Firebase project and ensure your configuration is linked in the source code.
4. **Launch Dev Server:**
   ```bash
   npm run dev
   ```

## Security Warning
This project implements client-side encryption. If you lose your **Master Access Key**, the data in the vault becomes mathematically impossible to recover, as the server only stores the encrypted ciphertext.
