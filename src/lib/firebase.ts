import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if available
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export interface SavedPass {
  id?: string;
  passCode: string;
  holderName: string;
  handle: string;
  role: string;
  track: string;
  motto: string;
  theme: string;
  imageUrl?: string;
  createdBy: string;
  creatorEmail?: string;
  creatorPhoto?: string;
  verified: boolean;
  verifiedAt?: any;
  verifiedBy?: string;
  createdAt?: any;
}

// Generate random uppercase Pass Code e.g. "GOA-8F92A"
export const generatePassCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GOA-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Save a pass to Firestore
export const savePassToDatabase = async (
  passData: Omit<SavedPass, 'id' | 'createdAt' | 'passCode' | 'verified'> & { passCode?: string; verified?: boolean }
): Promise<SavedPass> => {
  const passCode = passData.passCode || generatePassCode();
  const passDocRef = doc(collection(db, 'passes'));
  
  const newPass: SavedPass = {
    ...passData,
    id: passDocRef.id,
    passCode,
    verified: passData.verified ?? false,
  };

  await setDoc(passDocRef, {
    ...newPass,
    createdAt: serverTimestamp(),
  });

  return newPass;
};

// Search / Verify Pass by Pass Code or ID
export const verifyAndFetchPass = async (searchQuery: string): Promise<{ pass: SavedPass | null; message: string; isFound: boolean }> => {
  const queryStr = searchQuery.trim().toUpperCase();
  if (!queryStr) {
    return { pass: null, message: 'Please enter a valid Pass Code or ID', isFound: false };
  }

  try {
    // 1. First search by exact passCode
    const q = query(collection(db, 'passes'), where('passCode', '==', queryStr));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data() as SavedPass;
      return {
        pass: { ...data, id: docSnap.id },
        message: 'Pass found & verified in official Goa Hacker House database!',
        isFound: true,
      };
    }

    // 2. Try searching by document ID
    const docRef = doc(db, 'passes', queryStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SavedPass;
      return {
        pass: { ...data, id: docSnap.id },
        message: 'Pass found & verified in official Goa Hacker House database!',
        isFound: true,
      };
    }

    return { pass: null, message: `No pass record found for "${searchQuery}". Pass may be unverified or forged.`, isFound: false };
  } catch (error: any) {
    console.error('Verify Pass Error:', error);
    return { pass: null, message: 'Error checking database verification: ' + error.message, isFound: false };
  }
};

// Mark Pass as Officially Verified in Firestore
export const setPassVerified = async (passId: string, verifierName: string): Promise<boolean> => {
  try {
    const passRef = doc(db, 'passes', passId);
    await updateDoc(passRef, {
      verified: true,
      verifiedAt: serverTimestamp(),
      verifiedBy: verifierName,
    });
    return true;
  } catch (err) {
    console.error('Failed to set verified status:', err);
    return false;
  }
};

// Fetch latest public passes
export const fetchRecentPasses = async (): Promise<SavedPass[]> => {
  try {
    const q = query(
      collection(db, 'passes'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      ...(docSnap.data() as SavedPass),
      id: docSnap.id
    }));
  } catch (err) {
    console.error('Fetch recent passes error:', err);
    return [];
  }
};
