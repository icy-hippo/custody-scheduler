// Import the functions you need from the SDKs you need


import { getAnalytics } from "firebase/analytics";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsic42ahCXbVX06OiFIj31dl52TzdD5_w",
  authDomain: "custody-scheduler.firebaseapp.com",
  projectId: "custody-scheduler",
  storageBucket: "custody-scheduler.firebasestorage.app",
  messagingSenderId: "1033807070827",
  appId: "1:1033807070827:web:9da2e6cd364f9d30c3d32e",
  measurementId: "G-6JFR53XY27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);