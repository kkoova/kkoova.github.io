let config = { topics: [] };
let isSpinning = false;
let rerollAvailable = true;
let currentTopic = null;
let history = JSON.parse(localStorage.getItem('it_course_history')) || [];

async function init() {
    try {
        const res = await fetch('data.json');
        const data = await res.json();
        config.topics = data.topics;
        drawWheel();
        updateClock();
        setInterval(updateClock, 1000);
    } catch (e) { console.error("Ошибка загрузки JSON:", e); }
}

function updateSystemUI() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toTimeString().split(' ')[0];
    
    // Динамический Knowledge Load (пример: прогресс с сентября по декабрь)
    const start = new Date(now.getFullYear(), 8, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    const progress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    document.querySelector('.mini-bar div').style.width = progress + '%';
}

// 1. ОПРЕДЕЛЕНИЕ РОЛИ
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('admin') === 'aaaa';

if (isAdmin) {
    document.body.classList.add('state-admin');
    document.getElementById('user-role').innerText = 'TEACHER_ADMIN';
    document.getElementById('student-tools').style.display = 'none';
    document.getElementById('report-stud').style.display = 'none';
} else {
    document.getElementById('spinBtn').style.display = 'none';
    document.getElementById('admin-btn').style.display = 'none';
}

// 2. ФУНКЦИЯ РАЗБЛОКИРОВКИ ТЕМЫ ДЛЯ СТУДЕНТА
function unlockTopic() {
    const code = document.getElementById('topicCodeInput').value;
    const topic = config.topics.find(t => t.id === code);

    if (topic) {
        showTopic(topic);
    } else {
        alert("INVALID_CODE. ASK_YOUR_TEACHER.");
    }
}

// 3. СДАЧА РАБОТЫ (LOGBOOK)
function submitWork() {
    const fio = document.getElementById('studentFIO').value;
    const repo = document.getElementById('repoLink').value;

    if (!fio || !repo) {
        alert("ERROR: FILL_ALL_FIELDS");
        return;
    }

    // Сохраняем в историю этого компьютера
    const sessionData = {
        topicId: currentTopic.id,
        topicTitle: currentTopic.title,
        students: fio,
        repository: repo,
        timestamp: new Date().toISOString()
    };

    let studentHistory = JSON.parse(localStorage.getItem('student_submissions')) || [];
    studentHistory.push(sessionData);
    localStorage.setItem('student_submissions', JSON.stringify(studentHistory));

    location.reload();
}

function drawWheel() {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const cx = 300, cy = 300, r = 280;
    const slice = (2 * Math.PI) / config.topics.length;

    ctx.clearRect(0, 0, 600, 600);

    // --- 1. РИСУЕМ ВНЕШНИЕ НАСЕЧКИ (как на шкале прибора) ---
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.lineWidth = (i % 5 === 0) ? 2 : 1; // Каждая 5-я черточка толще
        ctx.strokeStyle = (i % 5 === 0) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)";
        
        const tickLength = (i % 5 === 0) ? 15 : 8;
        ctx.moveTo(r + 5, 0);
        ctx.lineTo(r + 5 + tickLength, 0);
        ctx.stroke();
        ctx.rotate((2 * Math.PI) / 60);
    }
    ctx.restore();

    // --- 2. РИСУЕМ СЕКТОРА И ТЕКСТ ---
    config.topics.forEach((t, i) => {
        const historyToCheck = isAdmin ? 
            JSON.parse(localStorage.getItem('it_course_history')) || [] : 
            JSON.parse(localStorage.getItem('student_submissions')) || [];

        const isDone = historyToCheck.some(h => h.id === t.id || h.topicId === t.id);
        const angle = i * slice;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Основная разделительная линия
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.86)";
        ctx.moveTo(0, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();

        // Текст темы
        ctx.rotate(slice / 2); // Смещаем в центр сектора
        ctx.fillStyle = isDone ? "#7c7c7c" : "#fff";
        // Используем твой шрифт и чуть увеличим отступ
        ctx.font = "14px LatteraMonoLL, NDot, monospace"; 
        ctx.textAlign = "right"; // Прижимаем к краю
        ctx.fillText(t.title.toUpperCase(), r - 30, 5);
        
        ctx.restore();
    });

    // --- 3. ЦЕНТРАЛЬНЫЙ ДЕКОР (Маленький круг в центре) ---
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.stroke();
}

function saveSession() {
    history.push({
        id: currentTopic.id,
        title: currentTopic.title,
        commit: 'Complite',
        date: new Date().toISOString()
    });

    localStorage.setItem('it_course_history', JSON.stringify(history));
    location.reload();
}

document.getElementById('spinBtn').onclick = () => {
    if (isSpinning) return;

    // 1. Фильтруем темы: оставляем только те, которых НЕТ в истории
    const availableTopics = config.topics.filter(topic => 
        !history.some(h => h.id === topic.id)
    );

    // 2. Проверяем, не закончились ли темы вообще
    if (availableTopics.length === 0) {
        alert("Жест крутые");
        // Если всё прошли, разрешаем крутить по второму кругу (очищаем историю для этого сеанса)
        history = []; 
    }

    isSpinning = true;

    // 3. Выбираем случайную тему из ДОСТУПНЫХ
    const targetTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    
    // 4. Находим индекс этой темы в ПОЛНОМ списке (чтобы знать, куда крутить на холсте)
    const targetIndex = config.topics.findIndex(t => t.id === targetTopic.id);

    // 5. РАСЧЕТ УГЛА (Математика прицеливания)
    const sliceDeg = 360 / config.topics.length; // Размер одного сектора
    const extraSpins = 2160; // 6 полных оборотов (для красоты)
    
    // Вычисляем угол так, чтобы выбранный сектор оказался под указателем (270 градусов)
    // Формула: (Полные обороты) + (Коррекция указателя) - (Центр нужного сектора)
    const targetCenter = (targetIndex * sliceDeg) + (sliceDeg / 2);
    const finalDeg = extraSpins + (360 - targetCenter + 270) % 360;

    // 6. Запускаем анимацию
    const wheel = document.getElementById('wheel');
    wheel.style.transform = `rotate(${finalDeg}deg)`;

    setTimeout(() => {
        isSpinning = false;
        showTopic(targetTopic);
    }, 5000);
};

document.getElementById('rerollBtn').onclick = () => {
    if (!rerollAvailable) return;
    
    rerollAvailable = false;
    document.getElementById('rerollBtn').innerText = "LOCKED_SYSTEM";
    document.getElementById('rerollBtn').style.opacity = "0.3";
    
    // Возвращаемся к колесу и крутим снова
    document.getElementById('app-container').className = 'view-wheel';
    setTimeout(spin, 800); 
};

setInterval(updateSystemUI, 1000);

document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    
    const container = document.getElementById('app-container');
    container.style.transform = `perspective(1000px) rotateX(${-y}deg) rotateY(${x}deg)`;
});

function showTopic(topic) {
    currentTopic = topic;
    // 0. Меняем фон
    document.getElementById('productBg').style.backgroundImage = `url(${topic.bgImage})`;
    
    // 1. Тексты
    document.getElementById('topicTitle').innerText = topic.title;
    document.getElementById('topicTag').innerText = "ID // " + topic.id;
    document.getElementById('liveTask').innerText = topic.liveTask;
    document.getElementById('selfTask').innerText = topic.selfTask;
    document.getElementById('teamSize').innerText = topic.teamSize;
    document.getElementById('difficulty').innerText = topic.difficulty;

    // 2. Летающие иконки
    const feats = document.getElementById('features-container');
    feats.innerHTML = '';
    const pos = [{t:'15%', l:'10%'}, {b:'20%', l:'15%'}, {t:'10%', r:'10%'}, {b:'15%', r:'15%'}];

    topic.features.forEach((f, i) => {
        const node = document.createElement('div');
        node.className = 'feature-node';
        node.style.top = pos[i].t; node.style.left = pos[i].l;
        node.style.right = pos[i].r; node.style.bottom = pos[i].b;
        node.innerHTML = `
            <div class="f-icon"><img src="${f.icon}"></div>
            <div class="type-body" style="font-size:12px">${f.label}</div>
            <div style="font-size:10px; color:#666">${f.sub}</div>
        `;
        feats.appendChild(node);
    });

    const workspace = document.getElementById('steps-list');
    workspace.innerHTML = '';

    topic.steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item type-body';
        div.innerHTML = `
            <div class="checkbox-custom"></div>
            <span>${step.text}</span>
        `;
        
        // Клик по шагу
        div.onclick = () => {
            div.classList.toggle('completed');
            updateProgress();
        };
        workspace.appendChild(div);
    });

    document.getElementById('externalDocs').href = topic.docsUrl;

    // 3. Переход
    document.getElementById('app-container').className = 'view-result';
    document.querySelector('.btn-main-white').onclick = finishSession;
}

function updateProgress() {
    const total = currentTopic.steps.length;
    const completed = document.querySelectorAll('.step-item.completed').length;
    const percent = (completed / total) * 100;

    document.getElementById('step-progress').style.width = percent + '%';
    
    // Обновляем глобальный прогресс-бар в углу (для красоты)
    document.querySelector('.mini-bar div').style.width = percent + '%';
}

// Переключение между "Описание" и "Работа"
function startMission() {
    document.getElementById('topic-presentation').classList.add('hidden');
    document.getElementById('topic-workspace').classList.remove('hidden');
}

function updateClock() {
    const n = new Date();
    document.getElementById('clock').innerText = n.toTimeString().split(' ')[0];
}

init();