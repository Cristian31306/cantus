import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCN7_VxOUbN2X82kkK98_eIblw9fz58lq8",
    authDomain: "cantus-f2b44.firebaseapp.com",
    projectId: "cantus-f2b44",
    storageBucket: "cantus-f2b44.firebasestorage.app",
    messagingSenderId: "35310181232",
    appId: "1:35310181232:android:780665b2fa7b7da85bcdb5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
