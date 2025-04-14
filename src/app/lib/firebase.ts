import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: "AIzaSyBFjDqePMNZqZQ6OtMt8uUDKpew_Oc96Tc",
  authDomain: "yusuf-d8176.firebaseapp.com",
  projectId: "yusuf-d8176",
  storageBucket: "yusuf-d8176.firebasestorage.app",
  messagingSenderId: "426577829443",
  appId: "1:426577829443:web:7c133f7109ff0c21ff3ef6",
  measurementId: "G-CT21STSZ14"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
