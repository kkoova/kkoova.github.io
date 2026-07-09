import { 
    db, collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, updateDoc, arrayUnion 
} from './firebase-config.js';

const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // --- СОСТОЯНИЕ ИГРОКА И АВТОРИЗАЦИИ ---
        const currentStudent = ref(null);
        const authMode = ref('login');
        const loginForm = ref({ nickname: '', studentId: '' });
        const regForm = ref({ nickname: '', fullName: '', group: '', studentId: '' });

        // --- СОСТОЯНИЕ КАРТЫ И КОНТЕНТА ---
        const islands = ref([]);
        const paths = ref([]);
        const selectedIsland = ref(null);
        const leaderboard = ref([]);
        const showLeaderboard = ref(false);

        // --- СОСТОЯНИЕ КВИЗА (КОРАБЛИ) ---
        const quizState = ref('intro'); 
        const currentQuestionIndex = ref(0);
        const quizTimer = ref(0);
        const quizScore = ref(0);
        const timerInterval = ref(null);

        // --- ЛОГИКА ГЕНЕРАЦИИ ПУТЕЙ (С ХАОСОМ) ---
        const calculatePaths = () => {
            const newPaths = [];
            const sortedIslands = [...islands.value].sort((a, b) => {
                let orderA = a.order;
                let orderB = b.order;
                if (orderA === 7) orderA = 8; else if (orderA === 8) orderA = 7;
                if (orderB === 7) orderB = 8; else if (orderB === 8) orderB = 7;
                return orderA - orderB;
            });

            for (let i = 0; i < sortedIslands.length - 1; i++) {
                const start = sortedIslands[i];
                const end = sortedIslands[i + 1];
                
                if (end.order == 8 || end.order == 9) continue;

                const x1 = start.x + 50;
                const y1 = start.y + 50;
                const x2 = end.x + 50;
                const y2 = end.y + 50;

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const offset = 80; 
                const chaoticX = midX + (Math.sin(i) * offset); 
                const chaoticY = midY + (Math.cos(i) * offset);

                const d = `M ${x1} ${y1} Q ${chaoticX} ${chaoticY} ${x2} ${y2}`;
                newPaths.push({ d });
            }
            paths.value = newPaths;
        };

        // --- РАБОТА С ДАННЫМИ (FIREBASE) ---
        const loadIslands = async () => {
            const q = query(collection(db, "islands"), orderBy("order", "asc"));
            const snap = await getDocs(q);
            islands.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            calculatePaths();
        };

        const loadLeaderboard = async () => {
            const q = query(collection(db, "students"), orderBy("totalScore", "desc"));
            const snap = await getDocs(q);
            leaderboard.value = snap.docs.map(doc => doc.data());
            showLeaderboard.value = true;
        };

        const formatTimestamp = (ts) => {
            if (!ts) return "";
            return ts.toDate().toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        };

        const isQuizAvailable = (island) => {
            if (!island.availableFrom || !island.availableUntil) return true;
            const now = new Date();
            return now >= island.availableFrom.toDate() && now <= island.availableUntil.toDate();
        };

        // --- ЛОГИКА АВТОРИЗАЦИИ ---
        onMounted(async () => {
            const savedId = localStorage.getItem('pirate_token');
            if (savedId) {
                const docSnap = await getDoc(doc(db, "students", savedId));
                if (docSnap.exists()) {
                    currentStudent.value = { id: docSnap.id, ...docSnap.data() };
                    loadIslands();
                }
            }
        });

        const handleLogin = async () => {
            if (!loginForm.value.nickname || !loginForm.value.studentId) return alert("Заполни поля!");
            const q = query(collection(db, "students"), where("nickname", "==", loginForm.value.nickname), where("studentId", "==", loginForm.value.studentId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                localStorage.setItem('pirate_token', userDoc.id);
                currentStudent.value = { id: userDoc.id, ...userDoc.data() };
                loadIslands();
            } else {
                alert("Пират не найден!");
            }
        };

        const handleRegister = async () => {
            if (!regForm.value.nickname || !regForm.value.studentId) return alert("Заполни данные!");
            try {
                const docRef = await addDoc(collection(db, "students"), { ...regForm.value, totalScore: 0, completedQuizzes: [], createdAt: new Date() });
                localStorage.setItem('pirate_token', docRef.id);
                currentStudent.value = { id: docRef.id, ...regForm.value };
                loadIslands();
            } catch (e) { alert("Ошибка регистрации"); }
        };

        const logout = () => { localStorage.removeItem('pirate_token'); location.reload(); };

        // --- ЛОГИКА ВЗАИМОДЕЙСТВИЯ С ОСТРОВАМИ ---
        const openIsland = (island) => {
            selectedIsland.value = island;
            quizState.value = 'intro';
        };

        const closeIsland = () => {
            selectedIsland.value = null;
            quizState.value = 'intro';
            clearInterval(timerInterval.value);
        };

        // --- ЛОГИКА КВИЗА (ТЕСТЫ НА ВРЕМЯ) ---
        const startQuiz = () => {
            quizState.value = 'started';
            currentQuestionIndex.value = 0;
            quizScore.value = 0;
            quizTimer.value = selectedIsland.value.timeLimitSeconds || 60;
            
            timerInterval.value = setInterval(() => {
                if (quizTimer.value > 0) quizTimer.value--;
                else finishQuiz();
            }, 1000);
        };

        const handleAnswer = (index) => {
            const isCorrect = index === selectedIsland.value.questions[currentQuestionIndex.value].correct;
            if (isCorrect) quizScore.value++;
            if (currentQuestionIndex.value < selectedIsland.value.questions.length - 1) currentQuestionIndex.value++;
            else finishQuiz();
        };

        const finishQuiz = async () => {
            clearInterval(timerInterval.value);
            quizState.value = 'result';
            
            const studentRef = doc(db, "students", currentStudent.value.id);
            const scoreToAdd = quizScore.value * 10;
            const quizResult = {
                islandId: selectedIsland.value.id,
                score: quizScore.value,
                total: selectedIsland.value.questions.length,
                date: new Date()
            };
            
            await updateDoc(studentRef, {
                totalScore: (currentStudent.value.totalScore || 0) + scoreToAdd,
                completedQuizzes: arrayUnion(quizResult)
            });
            // Локально обновляем очки, чтобы рейтинг сразу изменился
            currentStudent.value.totalScore += scoreToAdd;
        };

        return { 
            currentStudent, authMode, loginForm, regForm, islands, selectedIsland,
            paths, showLeaderboard, leaderboard, quizState, currentQuestionIndex,
            quizTimer, quizScore, handleLogin, handleRegister, logout, openIsland, 
            closeIsland, loadLeaderboard, startQuiz, handleAnswer, formatTimestamp, isQuizAvailable
        };
    }
}).mount('#app');