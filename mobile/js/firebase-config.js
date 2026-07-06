import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAbUTirRRVQYKm5xhlyW8EfCC6u4vat4fk",
    authDomain: "mobile-godot.firebaseapp.com",
    projectId: "mobile-godot",
    storageBucket: "mobile-godot.firebasestorage.app",
    messagingSenderId: "627472316601",
    appId: "1:627472316601:web:5eea116c4967af86c48368"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Экспортируем всё необходимое для app.js
export { db, collection, addDoc, doc, getDoc, getDocs, query, where };