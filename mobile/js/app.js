import { db, collection, addDoc, doc, getDoc, getDocs, query, where, orderBy } from './firebase-config.js';

const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const currentStudent = ref(null);
        const authMode = ref('login');
        const islands = ref([]); // Хранилище островов
        const selectedIsland = ref(null); // Для модалки
        
        const loginForm = ref({ nickname: '', studentId: '' });
        const regForm = ref({ nickname: '', fullName: '', group: '', studentId: '' });

        const paths = ref([]);
        const showLeaderboard = ref(false); // Состояние для модалки рейтинга
        const leaderboard = ref([]);

        // Функция для расчета линий между островами
        const calculatePaths = () => {
            const newPaths = [];
            const sortedIslands = [...islands.value].sort((a, b) => {
                let orderA = a.order;
                let orderB = b.order;

                // Меняем виртуальный вес: если это 7, превращаем в 8, и наоборот
                if (orderA === 7) orderA = 8;
                else if (orderA === 8) orderA = 7;

                if (orderB === 7) orderB = 8;
                else if (orderB === 8) orderB = 7;

                return orderA - orderB;
            });

            for (let i = 0; i < sortedIslands.length - 1; i++) {
                const start = sortedIslands[i];
                const end = sortedIslands[i + 1];

                if (start == 9 || start == 7) return;
                // Координаты центров островов (добавляем смещение, чтобы линия выходила из центра)
                const x1 = start.x + 50;
                const y1 = start.y + 50;
                const x2 = end.x + 50;
                const y2 = end.y + 50;

                // Находим среднюю точку между островами
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                // Добавляем "хаос": случайное смещение для контрольной точки кривой
                // Чем больше число, тем сильнее изгиб. 
                // Используем индекс i, чтобы изгиб был "стабильным" и не дергался при перерисовке
                const offset = 80; 
                const chaoticX = midX + (Math.sin(i) * offset); 
                const chaoticY = midY + (Math.cos(i) * offset);

                // Формируем команду для Квадратичной кривой Безье: 
                // M = переместиться в начало, Q = согнуть через точку (chaotic), закончить в (x2, y2)
                const d = `M ${x1} ${y1} Q ${chaoticX} ${chaoticY} ${x2} ${y2}`;

                newPaths.push({ d });
            }
            paths.value = newPaths;
        };

        // Загрузка рейтинга
        const loadLeaderboard = async () => {
            const q = query(collection(db, "students"), orderBy("totalScore", "desc"));
            const snap = await getDocs(q);
            leaderboard.value = snap.docs.map(doc => doc.data());
            showLeaderboard.value = true;
        };

        // Обнови loadIslands, чтобы после загрузки считались пути
        const loadIslands = async () => {
            const q = query(collection(db, "islands"), orderBy("order", "asc"));
            const snap = await getDocs(q);
            islands.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            calculatePaths(); // <--- Считаем пути
        };

        onMounted(async () => {
            const savedId = localStorage.getItem('pirate_token');
            if (savedId) {
                const docSnap = await getDoc(doc(db, "students", savedId));
                if (docSnap.exists()) {
                    currentStudent.value = { id: docSnap.id, ...docSnap.data() };
                    // Если залогинены — грузим карту
                    loadIslands();
                }
            }
        });

        // Открытие острова
        const openIsland = (island) => {
            selectedIsland.value = island;
        };

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
            currentStudent, authMode, loginForm, regForm, islands, selectedIsland,
            handleLogin, handleRegister, logout, openIsland, paths, showLeaderboard,
            leaderboard, loadLeaderboard
        };
    }
}).mount('#app');