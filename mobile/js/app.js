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

                if (orderA === 9) orderA = 8;
                else if (orderA === 8) orderA = 9;

                if (orderB === 9) orderB = 8;
                else if (orderB === 8) orderB = 9;

                return orderA - orderB;
            });

            for (let i = 0; i < sortedIslands.length - 1; i++) {
                const start = sortedIslands[i];
                const end = sortedIslands[i + 1];

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

        const quizState = ref('intro'); // 'intro', 'started', 'result'
        const currentQuestionIndex = ref(0);
        const quizTimer = ref(0);
        const quizScore = ref(0);
        const timerInterval = ref(null);

        const startQuiz = () => {
            quizState.value = 'started';
            currentQuestionIndex.value = 0;
            quizScore.value = 0;
            quizTimer.value = selectedIsland.value.timeLimit;
            
            // Запуск таймера
            timerInterval.value = setInterval(() => {
                if (quizTimer.value > 0) {
                    quizTimer.value--;
                } else {
                    finishQuiz();
                }
            }, 1000);
        };

        const handleAnswer = (index) => {
            const isCorrect = index === selectedIsland.value.questions[currentQuestionIndex.value].correct;
            if (isCorrect) quizScore.value++;
            
            if (currentQuestionIndex.value < selectedIsland.value.questions.length - 1) {
                currentQuestionIndex.value++;
            } else {
                finishQuiz();
            }
        };

        const finishQuiz = async () => {
            clearInterval(timerInterval.value);
            quizState.value = 'result';
            
            // Сохранение в Firebase
            const studentRef = doc(db, "students", currentStudent.value.id);
            const quizResult = {
                islandId: selectedIsland.value.id,
                score: quizScore.value,
                total: selectedIsland.value.questions.length,
                date: new Date()
            };
            
            // Обновляем очки и добавляем результат (упрощенно)
            await updateDoc(studentRef, {
                totalScore: (currentStudent.value.totalScore || 0) + quizScore.value * 10,
                completedQuizzes: arrayUnion(quizResult)
            });
        };

        return { 
            currentStudent, authMode, loginForm, regForm, islands, selectedIsland,
            handleLogin, handleRegister, logout, openIsland, paths, showLeaderboard,
            leaderboard, loadLeaderboard
        };
    }
}).mount('#app');