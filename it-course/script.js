let config = { topics: [] };
let isSpinning = false;

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

function drawWheel() {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const cx = 300, cy = 300, r = 280;
    const slice = (2 * Math.PI) / config.topics.length;

    ctx.clearRect(0,0,600,600);
    config.topics.forEach((t, i) => {
        const angle = i * slice;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Линии
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.moveTo(0, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();

        // Текст
        ctx.rotate(slice / 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "12px Inter";
        ctx.fillText(t.title, 120, 5);
        ctx.restore();
    });
}

document.getElementById('spinBtn').onclick = () => {
    if(isSpinning) return;
    isSpinning = true;
    
    const deg = Math.floor(Math.random() * 360) + 2160; // 6 оборотов
    document.getElementById('wheel').style.transform = `rotate(${deg}deg)`;

    setTimeout(() => {
        isSpinning = false;
        const actualDeg = deg % 360;
        const sliceDeg = 360 / config.topics.length;
        // Расчет с учетом того, что pointer сверху
        const winner = Math.floor((360 - actualDeg + 270) % 360 / sliceDeg);
        showTopic(config.topics[winner]);
    }, 5000);
};

function showTopic(topic) {
    // 0. Меняем фон
    document.getElementById('productBg').style.backgroundImage = `url(${topic.bgImage})`;
    
    // 1. Тексты
    document.getElementById('topicTitle').innerText = topic.title;
    document.getElementById('topicTag').innerText = topic.tag;
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

    // 3. Переход
    document.getElementById('app-container').className = 'view-result';
}

function updateClock() {
    const n = new Date();
    document.getElementById('clock').innerText = n.toTimeString().split(' ')[0];
}

init();