import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC9rNY8ooNVkqQx4e5VNO5DFxByg1sIjLg",
    authDomain: "it-course-lele.firebaseapp.com",
    projectId: "it-course-lele",
    storageBucket: "it-course-lele.firebasestorage.app",
    messagingSenderId: "605493061801",
    appId: "1:605493061801:web:36caee46158b6ace8421b8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);