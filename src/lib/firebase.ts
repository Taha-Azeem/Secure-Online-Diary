import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db =
  firestoreDatabaseId === '(default)'
    ? getFirestore(app)
    : getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);

// Helpful runtime trace so it's obvious which database the app is targeting.
// eslint-disable-next-line no-console
console.info(`[Firebase] Using Firestore database: ${firestoreDatabaseId}`);

// Connect to the local Firestore emulator when VITE_USE_FIRESTORE_EMULATOR is set.
// Run the emulator with: `npm run emulators:start` and set VITE_USE_FIRESTORE_EMULATOR=true in your Vite env.
if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true') {
	// Default emulator host/port used by the Firebase CLI
	try {
		connectFirestoreEmulator(db, 'localhost', 8080);
		// eslint-disable-next-line no-console
		console.info('Connected to Firestore emulator at localhost:8080');
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn('Could not connect to Firestore emulator:', e);
	}
}
