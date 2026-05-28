import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
