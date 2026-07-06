import { db, collection, addDoc, doc, getDoc, getDocs, query, where } from './firebase-config.js';

const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const currentStudent = ref(null);
        const authMode = ref('login'); // 'login' или 'register'
        
        const loginForm = ref({ nickname: '', studentId: '' });
        const regForm = ref({ nickname: '', fullName: '', group: '', studentId: '' });

        // Проверка авторизации при загрузке
        onMounted(async () => {
            const savedId = localStorage.getItem('pirate_token');
            if (savedId) {
                const docSnap = await getDoc(doc(db, "students", savedId));
                if (docSnap.exists()) {
                    currentStudent.value = { id: docSnap.id, ...docSnap.data() };
                }
            }
        });

        // ВХОД
        const handleLogin = async () => {
            if (!loginForm.value.nickname || !loginForm.value.studentId) return alert("Заполни поля!");
            
            const q = query(
                collection(db, "students"), 
                where("nickname", "==", loginForm.value.nickname),
                where("studentId", "==", loginForm.value.studentId)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                localStorage.setItem('pirate_token', userDoc.id);
                currentStudent.value = { id: userDoc.id, ...userDoc.data() };
            } else {
                alert("Пират не найден! Проверь ник или зачетку.");
            }
        };

        // РЕГИСТРАЦИЯ
        const handleRegister = async () => {
            // Простая валидация
            if (!regForm.value.nickname || !regForm.value.studentId) return alert("Заполни данные!");

            try {
                const docRef = await addDoc(collection(db, "students"), {
                    ...regForm.value,
                    totalScore: 0,
                    completedIslands: [],
                    createdAt: new Date()
                });
                localStorage.setItem('pirate_token', docRef.id);
                currentStudent.value = { id: docRef.id, ...regForm.value };
            } catch (e) {
                alert("Ошибка при регистрации");
            }
        };

        const logout = () => {
            localStorage.removeItem('pirate_token');
            location.reload();
        };

        return { 
            currentStudent, authMode, loginForm, regForm, 
            handleLogin, handleRegister, logout 
        };
    }
}).mount('#app');