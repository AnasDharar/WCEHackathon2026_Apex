// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCT6aEJvqP8bMWGkBQiv3eRUiHkYauFKow",
  authDomain: "manah-aarogya.firebaseapp.com",
  projectId: "manah-aarogya",
  storageBucket: "manah-aarogya.firebasestorage.app",
  messagingSenderId: "852278303030",
  appId: "1:852278303030:web:cd528bbaa369441a5e7b97",
  measurementId: "G-5HFJRLC6DM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, signInWithPopup, signOut, db };