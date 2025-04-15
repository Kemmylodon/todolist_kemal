import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: "AIzaSyBPSESOy3cO7ooXpt7e3TuScZ57W75VzA0",
  authDomain: "todolistgeyz.firebaseapp.com",
  projectId: "todolistgeyz",
  storageBucket: "todolistgeyz.firebasestorage.app",
  messagingSenderId: "1004507495554",
  appId: "1:1004507495554:web:95abcb9a481fd44a83c89b",
  measurementId: "G-9ENEYK4HTW"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
