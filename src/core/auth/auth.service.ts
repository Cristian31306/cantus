import { useAuthStore } from '../../store/auth';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from 'firebase/auth';

import { auth } from './firebaseConfig';

export const AuthService = {
    subscribe: () => {
        return onAuthStateChanged(auth, (user) => {
            useAuthStore.getState().setUser(user);
            useAuthStore.getState().setLoading(false);
        });
    },

    signIn: async (email: string, pass: string) => {
        return await signInWithEmailAndPassword(auth, email, pass);
    },

    signUp: async (email: string, pass: string) => {
        return await createUserWithEmailAndPassword(auth, email, pass);
    },

    signOut: async () => {
        return await firebaseSignOut(auth);
    }
};
