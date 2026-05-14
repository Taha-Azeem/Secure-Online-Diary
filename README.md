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

## 🌐 Live Deployment
The application is automatically deployed to GitHub Pages. Access it here:
**[CipherDiary Live](https://taha-azeem.github.io/Secure-Online-Diary---Information-security/)**

> **Note:** The live version requires Firebase configuration for authentication and data storage.

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
5. **Build for Production:**
   ```bash
   npm run build
   ```

## Deployment
This project uses GitHub Actions for automated deployment to GitHub Pages. Every push to the `main` branch automatically:
1. Installs dependencies
2. Builds the React application
3. Deploys to GitHub Pages

The deployment workflow is defined in `.github/workflows/deploy.yml`.

## Security Warning
This project implements client-side encryption. If you lose your **Master Access Key**, the data in the vault becomes mathematically impossible to recover, as the server only stores the encrypted ciphertext.
