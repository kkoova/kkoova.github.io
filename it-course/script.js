import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GithubAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const provider = new GithubAuthProvider();

let config = { topics: [] };
let isSpinning = false;
let currentTopic = null;
let rerollAvailable = true;
let topicStatus = {};
let history = JSON.parse(localStorage.getItem('it_course_history')) || [];

const urlParams = new URLSearchParams(window.location.search);
const ADMIN_UID = "A4x3C68w2tSp65CplZgxEflCeVh1";
let isAdmin = false;

let allTeamsData = [];
let jury1Team = null;
let jury2Team = null;
let jury1Assignments = [];
let jury2Assignments = [];
// Настройка лимитов билетов на каждую тему
const TOPIC_LIMITS = {
    "1": 4, // Стартап - 4 команды
    "2": 4, // Профессии - 4 команды
    "3": 4, // Анти-UX - 4 команды
    "4": 4  // Факап - 4 команды
};
let currentCounts = { "1": 0, "2": 0, "3": 0, "4": 0 };

async function init() {
    try {
        const res = await fetch('data.json');
        const data = await res.json();
        config.topics = data.topics;
        
        listenToTopics();
        updateSystemUI();
        setInterval(updateSystemUI, 1000);
        animateParallax();
    } catch (e) { console.error(e); }
}

onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('login-overlay'); // На 11.11.html его нет
    
    if (user) {
        if (overlay) overlay.classList.remove('active'); // Проверка!
        
        const roleEl = document.getElementById('user-role');
        isAdmin = (user.uid === ADMIN_UID);
        
        if (isAdmin) {
            document.body.classList.add('state-admin');
            if (roleEl) roleEl.innerText = 'TEACHER_ADMIN // ROOT';

            const adminTabs = document.getElementById('admin-tabs');
            if (adminTabs) {
                adminTabs.style.display = 'flex';
                switchTab('tasks', document.querySelector('.tab-btn')); // Открываем вкладку заданий
                initAdminDashboard(); // Запускаем загрузку команд
            }
            
            if (document.getElementById('student-tools')) document.getElementById('student-tools').style.display = 'none';
            if (document.getElementById('report-stud')) document.getElementById('report-stud').style.display = 'none';
            if (document.getElementById('profile-btn')) document.getElementById('profile-btn').style.display = 'none';
        } else {
            document.body.classList.remove('state-admin');
            if (roleEl) roleEl.innerText = user.displayName ? user.displayName.toUpperCase() : 'DEV_STUDENT';
            
            if (document.getElementById('spinBtn')) document.getElementById('spinBtn').style.display = 'none';
            if (document.getElementById('admin-btn')) document.getElementById('admin-btn').style.display = 'none';
            if (document.getElementById('rerollBtn')) document.getElementById('rerollBtn').style.display = 'none';
            if (document.getElementById('profile-btn')) document.getElementById('profile-btn').style.display = 'inline-block';
        }
        init();
    } else {
        if (overlay) overlay.classList.add('active'); // Проверка!
    }
});

window.loginViaGithub = () => {
    signInWithPopup(auth, provider).catch(e => alert("AUTH_ERROR"));
};

function listenToTopics() {
    onSnapshot(collection(db, "topics"), (snapshot) => {
        snapshot.forEach((doc) => {
            topicStatus[doc.id] = doc.data().done;
        });
        drawWheel();
    });
}

function drawWheel() {
    const canvas = document.getElementById('wheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 300, cy = 300, r = 280;
    const slice = (2 * Math.PI) / config.topics.length;

    ctx.clearRect(0, 0, 600, 600);

    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.lineWidth = (i % 5 === 0) ? 2 : 1;
        ctx.strokeStyle = (i % 5 === 0) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)";
        ctx.moveTo(r + 5, 0);
        ctx.lineTo(r + 20, 0);
        ctx.stroke();
        ctx.rotate((2 * Math.PI) / 60);
    }
    ctx.restore();

    config.topics.forEach((t, i) => {
        const isDone = topicStatus[t.id] === true;
        const angle = i * slice;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.moveTo(0, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();

        ctx.rotate(slice / 2);
        ctx.fillStyle = isDone ? "#444" : "#fff";
        ctx.font = "14px LatteraMonoLL, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(t.title.toUpperCase(), r - 30, 5);
        ctx.restore();
    });
}

window.spin = () => {
    if (isSpinning || !isAdmin) return;

    // 1. Получаем список всех еще не выполненных тем
    const availableTopics = config.topics.filter(t => !topicStatus[t.id]);
    
    if (availableTopics.length === 0) return alert("ALL_COMPLETED");

    isSpinning = true;

    // --- ЛОГИКА ПЕРВОГО ЗАПУСКА ---
    let targetTopic;

    // Проверяем, есть ли хоть одна выполненная тема в базе (done: true)
    const completedCount = Object.values(topicStatus).filter(status => status === true).length;

    if (completedCount === 0) {
        // Если ничего еще не пройдено — принудительно находим тему 01
        targetTopic = config.topics.find(t => t.id === "01");
        
        // На случай, если Вы случайно удалили ID 01 из JSON
        if (!targetTopic) {
            targetTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        }
    } else {
        // Если база не пуста — выбираем случайную тему из доступных
        targetTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    }
    // ------------------------------

    // Находим индекс цели в общем списке для расчета анимации
    const targetIndex = config.topics.findIndex(t => t.id === targetTopic.id);
    
    const sliceDeg = 360 / config.topics.length;
    const targetCenter = (targetIndex * sliceDeg) + (sliceDeg / 2);
    
    // 2160 - это 6 полных оборотов
    const finalDeg = 2160 + (360 - targetCenter + 270) % 360;

    const wheel = document.getElementById('wheel');
    wheel.style.transform = `rotate(${finalDeg}deg)`;

    setTimeout(() => {
        isSpinning = false;
        showTopic(targetTopic);
    }, 5000);
};

function showTopic(topic) {
    currentTopic = topic;
    document.getElementById('productBg').style.backgroundImage = `url(${topic.bgImage})`;
    document.getElementById('topicTitle').innerText = topic.title;
    document.getElementById('topicTag').innerText = "ID // " + topic.id;


    const feats = document.getElementById('features-container');
    feats.innerHTML = '';
    const pos = [{t:'15%', l:'10%'}, {b:'20%', l:'15%'}, {t:'10%', r:'10%'}, {b:'15%', r:'15%'}];

    topic.features.forEach((f, i) => {
        const node = document.createElement('div');
        node.className = 'feature-node';
        Object.assign(node.style, { top: pos[i].t, left: pos[i].l, right: pos[i].r, bottom: pos[i].b });
        node.innerHTML = `<div class="f-icon"><img src="${f.icon}"></div><div class="type-body" style="font-size:12px">${f.label}</div><div style="font-size:10px; color:#666">${f.sub}</div>`;
        feats.appendChild(node);
    });

    const tutorialLink = document.getElementById('tutorial-link');

    tutorialLink.onclick = () => {
        console.log(topic.docsUrl)
        console.log(topic.docsUrl)
        if (topic.docsUrl == '1111') window.location.href = `./11.11.html`;
        else window.location.href = `mission.html?doc=${topic.docsUrl}`;
    };

    const workspace = document.getElementById('steps-list');
    workspace.innerHTML = '';
    topic.steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item type-body';
        div.innerHTML = `<div class="checkbox-custom"></div><span>${step.text}</span>`;
        div.onclick = () => {
            div.classList.toggle('completed');
            updateProgress();
        };
        workspace.appendChild(div);
    });

    //document.getElementById('externalDocs').href = topic.docsUrl;
    document.getElementById('app-container').className = 'view-result';
}

window.submitWork = async () => {
    const user = auth.currentUser;
    const repo = document.getElementById('repoLink').value;
    if (!repo) return alert("REPO_REQUIRED");
    if (!currentTopic) return alert("NO_TOPIC_SELECTED");

    try {
        const q = query(
            collection(db, "submissions"), 
            where("githubUid", "==", user.uid), 
            where("topicId", "==", currentTopic.id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            alert("ERROR: YOU_HAVE_ALREADY_SUBMITTED_REPORT_FOR_THIS_TOPIC");
            return;
        }

        await addDoc(collection(db, "submissions"), {
            studentName: user.displayName,
            githubUid: user.uid,
            repository: repo,
            topicId: currentTopic.id,
            topicTitle: currentTopic.title,
            timestamp: serverTimestamp()
        });
        alert("TRANSMISSION_SUCCESSFUL");
        document.getElementById('report-modal').classList.remove('active');
        location.reload();
    } catch (e) { alert("SYNC_ERROR: CHECK_CONSOLE"); }
};

window.unlockTopic = () => {
    const code = document.getElementById('topicCodeInput').value;
    const topic = config.topics.find(t => t.id === code);
    if (topic) showTopic(topic);
    else alert("INVALID_CODE");
};

window.markTopicDone = async () => {
    if (!isAdmin) return;
    try {
        await updateDoc(doc(db, "topics", currentTopic.id), { done: true });
        location.reload();

    } catch (e) { console.error(e); }
};

function updateProgress() {
    const steps = document.querySelectorAll('.step-item');
    const done = document.querySelectorAll('.step-item.completed');
    const percent = (done.length / steps.length) * 100;
    document.getElementById('step-progress').style.width = percent + '%';
}

function updateSystemUI() {
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.innerText = new Date().toTimeString().split(' ')[0];
}

let mX = 0, mY = 0, cX = 0, cY = 0;
document.addEventListener('mousemove', e => {
    mX = (e.clientX / window.innerWidth - 0.5) * 15;
    mY = (e.clientY / window.innerHeight - 0.5) * 15;
});

function animateParallax() {
    cX += (mX - cX) * 0.05;
    cY += (mY - cY) * 0.05;
    const stage = document.getElementById('app-container');
    if (stage) stage.style.transform = `perspective(1000px) rotateX(${-cY}deg) rotateY(${cX}deg)`;
    requestAnimationFrame(animateParallax);
}

window.logout = () => {
    signOut(auth).then(() => {
        console.log("System logged out");
    }).catch((error) => {
        console.error("Logout error:", error);
    });
};

window.openProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Открываем модальное окно и заполняем данные из GitHub
    document.getElementById('profile-modal').classList.add('active');
    document.getElementById('prof-name').innerText = user.displayName ? user.displayName.toUpperCase() : "STUDENT_DEV";
    document.getElementById('prof-email').innerText = user.email || "NO_EMAIL";
    if (user.photoURL) {
        document.getElementById('prof-avatar').src = user.photoURL;
    }

    // 2. Ищем в Firebase все работы, которые сдал именно этот студент
    const list = document.getElementById('prof-list');
    list.innerHTML = `<div class="type-body" style="color:#666; padding: 15px 0;">SEARCHING_LOGBOOK...</div>`;
    
    try {
        const q = query(collection(db, "submissions"), where("githubUid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        list.innerHTML = "";
        let count = 0;

        if (querySnapshot.empty) {
            list.innerHTML = `<div class="type-body" style="color:#888; padding: 15px 0;">NO_MISSIONS_COMPLETED_YET</div>`;
        } else {
            querySnapshot.forEach((doc) => {
                count++;
                const data = doc.data();
                const item = document.createElement('div');
                item.className = "type-body";
                item.style = "padding: 12px 0; border-bottom: 1px dashed rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: center;";
                
                // Красивое отображение: Название темы и ссылка на Гитхаб
                item.innerHTML = `
                    <span>#${data.topicId} // ${data.topicTitle.toUpperCase()}</span>
                    <a href="${data.repository}" target="_blank" class="logout-trigger"">[ REPO ]</a>
                `;
                list.appendChild(item);
            });
        }

        // 3. Считаем процент прохождения курса (например, 3 работы из 10 = 30%)
        document.getElementById('prof-count').innerText = count;
        const totalTopics = config.topics ? config.topics.length : 10;
        const percent = Math.min(100, Math.round((count / totalTopics) * 100)) || 0;
        
        document.getElementById('prof-percent').innerText = `${percent}%`;
        document.getElementById('prof-bar').style.width = `${percent}%`;

    } catch (e) {
        console.error("Ошибка загрузки профиля:", e);
        list.innerHTML = `<div class="type-body" style="color:#ff4444; padding: 15px 0;">ERROR_FETCHING_DATA</div>`;
    }
};

window.closeProfile = () => {
    document.getElementById('profile-modal').classList.remove('active');
};

const profBtn = document.getElementById('profile-btn');
if (profBtn) profBtn.onclick = window.openProfile;

if (document.getElementById('spinBtn')) document.getElementById('spinBtn').onclick = window.spin;
if (document.getElementById('github-auth-btn')) document.getElementById('github-auth-btn').onclick = window.loginViaGithub;
if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = window.logout;
if (document.getElementById('profile-btn')) document.getElementById('profile-btn').onclick = window.openProfile;

const rerollBtn = document.getElementById('rerollBtn');
if (rerollBtn) {
    rerollBtn.onclick = () => {
        if (!rerollAvailable) return;
        rerollAvailable = false;
        rerollBtn.innerText = "[ LOCKED_SYSTEM ]";
        if (document.getElementById('app-container')) document.getElementById('app-container').className = 'view-wheel';
        setTimeout(spin, 800); 
    };
}

window.submitFeedWork = async () => {
    const user = auth.currentUser;
    const feed = document.getElementById('feedLink').value;
    if (!feed) return alert("FEED_REQUIRED");

    try {
        const q = query(
            collection(db, "feedback-it"), 
            where("githubUid", "==", user.uid)
        );

        await addDoc(collection(db, "feedback-it"), {
            studentName: user.displayName,
            githubUid: user.uid,
            feedback: feed,
            timestamp: serverTimestamp()
        });
        alert("TRANSMISSION_SUCCESSFUL");
        document.getElementById('feedback-modal').classList.remove('active');
        location.reload();
    } catch (e) { alert("SYNC_ERROR: CHECK_CONSOLE"); }
};

window.openReport = () => document.getElementById('report-modal').classList.add('active');
window.closeReport = () => document.getElementById('report-modal').classList.remove('active');
window.startMission = () => {
    document.getElementById('topic-presentation').classList.add('hidden');
    document.getElementById('topic-workspace').classList.remove('hidden');
};


window.openFeedReport = () => document.getElementById('feedback-modal').classList.add('active');
window.closeFeedReport = () => document.getElementById('feedback-modal').classList.remove('active');

// --- ЛОГИКА СТУДЕНТОВ (С ЛИМИТАМИ) ---
let selectedTopicId = null;
let selectedTopicTitle = null;

// Функция проверки свободных мест
window.checkAvailability = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "teams"));
        currentCounts = { "1": 0, "2": 0, "3": 0, "4": 0 };
        
        // Считаем, сколько команд уже записалось на каждую тему
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (currentCounts[data.topicId] !== undefined) {
                currentCounts[data.topicId]++;
            }
        });

        // Обновляем визуал карточек
        document.querySelectorAll('.step-card').forEach(card => {
            const topicId = card.dataset.topic;
            const limit = TOPIC_LIMITS[topicId] || 99;
            const taken = currentCounts[topicId] || 0;
            const left = limit - taken;

            // Добавляем или обновляем бейдж с местами
            let badge = card.querySelector('.seats-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'seats-badge';
                const header = card.querySelector('h2');
                if (header) header.appendChild(badge);
            }

            if (left <= 0) {
                badge.innerText = " МЕСТ НЕТ";
                card.classList.add('disabled');
            } else {
                badge.innerText = `СВОБОДНО: ${left}`;
                card.classList.remove('disabled');
            }
        });
    } catch (e) {
        console.error("Ошибка при проверке мест:", e);
    }
};

// Запускаем проверку при загрузке страницы
setTimeout(checkAvailability, 1000); // Небольшая задержка, чтобы Firebase успел инициализироваться

// Обработка кликов по карточкам
document.querySelectorAll('.step-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (isAdmin) return; // Админ просто смотрит
        if (card.classList.contains('disabled')) {
            return alert("На эту тему больше нет мест! Выберите другую.");
        }

        document.querySelectorAll('.step-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        selectedTopicId = card.dataset.topic;
        selectedTopicTitle = card.dataset.title;
        
        const titleEl = document.getElementById('selected-topic-title');
        if(titleEl) titleEl.innerText = `Выбрано: ${selectedTopicTitle}`;
        
        const panel = document.getElementById('registration-panel');
        if(panel) panel.style.display = 'flex';
    });
});

window.closeRegistration = () => {
    const panel = document.getElementById('registration-panel');
    if (panel) panel.style.display = 'none';
    document.querySelectorAll('.step-card').forEach(c => c.classList.remove('selected'));
};

window.submitTeam = async () => {
    const teamName = document.getElementById('team-name').value.trim();
    const teamFio = document.getElementById('team-fio').value.trim();

    if (!teamName || !teamFio) return alert("Заполните название и ФИО!");
    if (!selectedTopicId) return alert("Выберите задание!");

    try {
        // 1. Жесткая проверка ПЕРЕД записью (защита от одновременной записи двух студентов)
        const querySnapshot = await getDocs(collection(db, "teams"));
        let currentTaken = 0;
        querySnapshot.forEach((doc) => {
            if (doc.data().topicId === selectedTopicId) currentTaken++;
        });

        if (currentTaken >= TOPIC_LIMITS[selectedTopicId]) {
            alert("Упс! Кто-то только что занял последнее место на эту тему. Выберите другую.");
            closeRegistration();
            checkAvailability(); // Обновляем карточки
            return;
        }

        // 2. Записываем в базу
        await addDoc(collection(db, "teams"), {
            teamName: teamName,
            fio: teamFio,
            topicId: selectedTopicId,
            topicTitle: selectedTopicTitle,
            timestamp: serverTimestamp()
        });

        alert("УСПЕШНО! Вы записаны.");
        closeRegistration();
        document.getElementById('team-name').value = '';
        document.getElementById('team-fio').value = '';
        
        // 3. Обновляем свободные места на экране
        checkAvailability();

    } catch (e) {
        console.error(e);
        alert("Ошибка при отправке.");
    }
};

// --- ЛОГИКА АДМИНА ---
window.initAdminDashboard = async () => {
    const select1 = document.getElementById('jury1-select');
    const select2 = document.getElementById('jury2-select');
    
    if (!select1 || !select2) return;
    
    select1.innerHTML = '<option value="">-- Загрузка... --</option>';
    select2.innerHTML = '<option value="">-- Загрузка... --</option>';

    try {
        const querySnapshot = await getDocs(collection(db, "teams"));
        allTeamsData = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            allTeamsData.push(data);
        });

        if (allTeamsData.length === 0) {
            select1.innerHTML = '<option value="">-- Нет команд --</option>';
            select2.innerHTML = '<option value="">-- Нет команд --</option>';
            return;
        }

        // Очищаем и добавляем дефолтный пункт
        select1.innerHTML = '<option value="">-- Выберите команду --</option>';
        select2.innerHTML = '<option value="">-- Выберите команду --</option>';

        // Заполняем оба селекта
        allTeamsData.forEach((team, index) => {
            const optionHTML = `<option value="${index}">${team.teamName} (${team.topicTitle})</option>`;
            select1.innerHTML += optionHTML;
            select2.innerHTML += optionHTML;
        });

        // Вызываем функцию, чтобы скрыть уже выбранные команды (если селекты не пустые)
        updateJurySelects();

    } catch (e) {
        console.error("Ошибка загрузки данных для админа:", e);
        select1.innerHTML = '<option value="">-- Ошибка загрузки --</option>';
        select2.innerHTML = '<option value="">-- Ошибка загрузки --</option>';
    }
};

window.updateJurySelects = () => {
    const idx1 = document.getElementById('jury1-select').value;
    const idx2 = document.getElementById('jury2-select').value;

    const options1 = document.getElementById('jury1-select').options;
    const options2 = document.getElementById('jury2-select').options;

    // Восстанавливаем видимость всех опций
    for (let i = 0; i < options1.length; i++) options1[i].style.display = '';
    for (let i = 0; i < options2.length; i++) options2[i].style.display = '';

    // Прячем выбранное в Жюри 1 из списка Жюри 2
    if (idx1 !== "") {
        for (let i = 0; i < options2.length; i++) {
            if (options2[i].value === idx1) options2[i].style.display = 'none';
        }
    }

    // Прячем выбранное в Жюри 2 из списка Жюри 1
    if (idx2 !== "") {
        for (let i = 0; i < options1.length; i++) {
            if (options1[i].value === idx2) options1[i].style.display = 'none';
        }
    }
};

window.updateJurySelects = () => {
    const idx1 = document.getElementById('jury1-select').value;
    const idx2 = document.getElementById('jury2-select').value;

    const options1 = document.getElementById('jury1-select').options;
    const options2 = document.getElementById('jury2-select').options;

    // Восстанавливаем видимость всех опций
    for (let i = 0; i < options1.length; i++) options1[i].style.display = '';
    for (let i = 0; i < options2.length; i++) options2[i].style.display = '';

    // Прячем выбранное в Жюри 1 из списка Жюри 2
    if (idx1 !== "") {
        for (let i = 0; i < options2.length; i++) {
            if (options2[i].value === idx1) options2[i].style.display = 'none';
        }
    }

    // Прячем выбранное в Жюри 2 из списка Жюри 1
    if (idx2 !== "") {
        for (let i = 0; i < options1.length; i++) {
            if (options1[i].value === idx2) options1[i].style.display = 'none';
        }
    }
};

window.switchTab = (tabName, btnElement) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.add('active');
};

window.distributeProjects = () => {
    const idx1 = document.getElementById('jury1-select').value;
    const idx2 = document.getElementById('jury2-select').value;

    if (idx1 === "" || idx2 === "") return alert("Выберите обе команды жюри!");
    if (idx1 === idx2) return alert("Команды жюри не могут совпадать!");

    jury1Team = allTeamsData[idx1];
    jury2Team = allTeamsData[idx2];

    document.getElementById('jury1-title').innerText = `Жюри: ${jury1Team.teamName}`;
    document.getElementById('jury2-title').innerText = `Жюри: ${jury2Team.teamName}`;

    // Берем всех, КРОМЕ двух команд жюри
    let otherTeams = allTeamsData.filter(t => t.id !== jury1Team.id && t.id !== jury2Team.id);
    
    // Перемешиваем оставшихся
    otherTeams = otherTeams.sort(() => Math.random() - 0.5);

    // Делим пополам
    const half = Math.ceil(otherTeams.length / 2);
    jury1Assignments = otherTeams.slice(0, half);
    jury2Assignments = otherTeams.slice(half);

    // ВАЖНО: Жюри 1 оценивает Жюри 2, и наоборот
    jury1Assignments.push(jury2Team);
    jury2Assignments.push(jury1Team);

    // Отрисовываем списки на экране
    renderList('jury1-list', jury1Assignments);
    renderList('jury2-list', jury2Assignments);

    // Генерируем бланки для печати
    generatePrintForms();
    
    // Автоматически переключаем на вкладку с печатью
    const printTabBtn = document.querySelectorAll('.tab-btn')[2];
    switchTab('print', printTabBtn);
};

window.renderList = (elementId, teamsArray) => {
    const list = document.getElementById(elementId);
    if(!list) return;
    list.innerHTML = '';
    if(teamsArray.length === 0) list.innerHTML = '<li style="color:#666;">Пусто</li>';
    
    teamsArray.forEach((team, i) => {
        list.innerHTML += `<li><span style="color:var(--accent-yellow)">${i+1}.</span> ${team.teamName} <br><span style="font-size:11px; color:#888;">(${team.topicTitle})</span></li>`;
    });
};

window.randomizeQueue = () => {
    if (allTeamsData.length === 0) return alert("Нет команд!");
    let shuffled = [...allTeamsData].sort(() => Math.random() - 0.5);
    const list = document.getElementById('queue-list');
    if(!list) return;
    list.innerHTML = '';
    
    shuffled.forEach((team, i) => {
        list.innerHTML += `<li><strong>${i+1}.</strong> ${team.teamName} <br><span style="font-size:11px; color:#888;">${team.topicTitle}</span></li>`;
    });
};

window.generatePrintForms = () => {
    const container = document.getElementById('print-container');
    if(!container) return;
    container.innerHTML = '';
    
    const createForm = (team, assignedJury) => `
        <div class="jury-form">
            <div class="doc-header">
                <div class="doc-code">ФОРМА № 67-IT</div>
                <h1>Оценочный бланк задания</h1>
                <p class="subtitle">Оценочная комиссия // IT-направление</p>
            </div>
            
            <div class="form-info">
                <p><span class="label">Команда:</span> <span class="value">${team.teamName}</span></p>
                <p><span class="label">Тема:</span> <span class="value">${team.topicTitle} (ID: ${team.topicId})</span></p>
                <p><span class="label">Состав (ФИО):</span> <span class="value">${team.fio}</span></p>
                <p><span class="label" style="background:#eee; padding:2px;">Оценивает жюри:</span> <span class="value" style="font-weight:bold;">${assignedJury}</span></p>
            </div>

            <table class="criteria-table">
                <thead>
                    <tr>
                        <th width="5%">№</th>
                        <th width="65%">Критерий оценки</th>
                        <th width="15%">Макс.</th>
                        <th width="15%">Балл</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="score-cell">1</td>
                        <td>
                            <strong>Структура и титульный лист.</strong>
                            <span class="crit-desc">• Наличие титульного слайда с указанием темы и ФИО.<br>• Соответствие заданию (соблюдено требуемое или большее количество слайдов).<br>• Логичность и последовательность повествования.</span>
                        </td>
                        <td class="score-cell">5</td>
                        <td class="score-cell"></td>
                    </tr>
                    <tr>
                        <td class="score-cell">2</td>
                        <td>
                            <strong>Содержание и глубина проработки.</strong>
                            <span class="crit-desc">• Раскрыта ли заявленная тема?<br>• Понятно ли предложенное решение?<br>• Отвечают ли слайды на поставленные вопросы?</span>
                        </td>
                        <td class="score-cell">5</td>
                        <td class="score-cell"></td>
                    </tr>
                    <tr>
                        <td class="score-cell">3</td>
                        <td>
                            <strong>Дизайн и оформление презентации.</strong>
                            <span class="crit-desc">• Отсутствие стандартного шаблона PowerPoint.<br>• Читаемость текста, единая цветовая гамма.<br>• Использование инструментов (Figma, Canva, Notion, Paint или рисунков от руки).</span>
                        </td>
                        <td class="score-cell">5</td>
                        <td class="score-cell"></td>
                    </tr>
                    <tr>
                        <td class="score-cell">4</td>
                        <td>
                            <strong>Подача материала (Elevator Pitch).</strong>
                            <span class="crit-desc">• Соблюдение тайминга.<br>• Отсутствие чтения с листа.<br>• Участие всех членов команды в защите.</span>
                        </td>
                        <td class="score-cell">5</td>
                        <td class="score-cell"></td>
                    </tr>
                    <tr>
                        <td class="score-cell">5</td>
                        <td>
                            <strong>Вау-эффект и ответы на вопросы.</strong>
                            <span class="crit-desc">• Креативность, нестандартный подход, мемы.<br>• Умение аргументировать свою позицию.<br>• Компетентность при ответах на вопросы жюри.</span>
                        </td>
                        <td class="score-cell">5</td>
                        <td class="score-cell"></td>
                    </tr>
                    <tr>
                        <td colspan="2" style="text-align: right; font-weight: bold; font-size: 12pt;">ИТОГО НАБРАНО:</td>
                        <td class="score-cell" style="font-size: 12pt;">25</td>
                        <td class="score-cell"></td>
                    </tr>
                </tbody>
            </table>

            <div class="grading-scale">
                <p><strong>Шкала перевода баллов в оценку:</strong></p>
                <p>23 - 25 = «ОТЛИЧНО» &nbsp;|&nbsp; 18 - 22 = «ХОРОШО» &nbsp;|&nbsp; 13 - 17 = «УДОВЛЕТВОРИТЕЛЬНО» &nbsp;|&nbsp; 0 - 12 = «НЕУДОВЛЕТВОРИТЕЛЬНО»</p>
            </div>

            <div class="writing-box">
                <p class="title">Вопросы от комиссии:</p>
                <div class="lines-container">
                    <div class="line"></div>
                    <div class="line"></div>
                    <div class="line"></div>
                </div>
            </div>
            
            <div class="writing-box">
                <p class="title">Комментарии и рекомендации:</p>
                <div class="lines-container">
                    <div class="line"></div>
                    <div class="line"></div>
                    <div class="line"></div>
                </div>
            </div>

            <div class="signatures">
                <div>Член комиссии: <span class="signature-line"></span></div>
                <div>Расшифровка: <span class="signature-line" style="width: 110px;"></span></div>
                <div>Дата: «___» ______ 2026 г.</div>
            </div>
        </div>
    `;

    if (jury1Team) jury1Assignments.forEach(team => container.innerHTML += createForm(team, jury1Team.teamName));
    if (jury2Team) jury2Assignments.forEach(team => container.innerHTML += createForm(team, jury2Team.teamName));
};