let config = { topics: [] };
let isSpinning = false;

// 1. Загрузка данных
async function init() {
    const res = await fetch('data.json');
    config.topics = (await res.json()).topics;
    drawWheel();
    updateClock();
    setInterval(updateClock, 1000);
}

// 2. Рисуем колесо
function drawWheel() {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const centerX = 300, centerY = 300, radius = 280;
    const slice = (2 * Math.PI) / config.topics.length;

    ctx.clearRect(0,0,600,600);
    config.topics.forEach((t, i) => {
        const angle = i * slice;
        
        // Линии секторов
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();

        // Текст
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + slice/2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "12px Inter";
        ctx.fillText(t.title, 120, 5);
        ctx.restore();
    });
}

// 3. Логика вращения
document.getElementById('spinBtn').onclick = () => {
    if(isSpinning) return;
    isSpinning = true;
    
    const deg = Math.floor(Math.random() * 360) + 1800; // 5 оборотов
    document.getElementById('wheel').style.transform = `rotate(${deg}deg)`;

    setTimeout(() => {
        isSpinning = false;
        const actualDeg = deg % 360;
        const sliceDeg = 360 / config.topics.length;
        // 270 - коррекция под верхний указатель
        const winner = Math.floor((360 - actualDeg + 270) % 360 / sliceDeg);
        showTopic(config.topics[winner]);
    }, 5000);
};

function showTopic(topic) {
    document.getElementById('productBg').style.backgroundImage = `url(${topic.bgImage})`;
    document.getElementById('topicTitle').innerText = topic.title;
    document.getElementById('liveTask').innerText = topic.liveTask;
    document.getElementById('selfTask').innerText = topic.selfTask;
    document.getElementById('teamSize').innerText = topic.teamSize;
    document.getElementById('difficulty').innerText = topic.difficulty;

    // Отрисовка фич
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

    document.getElementById('app-container').className = 'view-result';
}

function updateClock() {
    const n = new Date();
    document.getElementById('clock').innerText = n.toTimeString().split(' ')[0];
}

init();