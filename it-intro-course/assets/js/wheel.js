let topics = [];
let rerollsUsed = 0;
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let currentAngle = 0;

// 1. Загружаем данные
async function loadData() {
    const response = await fetch('data/topics.json');
    const data = await response.json();
    topics = data.topics;
    drawWheel();
}

// 2. Рисуем колесо
function drawWheel() {
    const sectorAngle = (2 * Math.PI) / topics.length;
    topics.forEach((topic, i) => {
        ctx.beginPath();
        ctx.fillStyle = i % 2 === 0 ? '#34495e' : '#2c3e50'; // Чередуем цвета
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 250, i * sectorAngle, (i + 1) * sectorAngle);
        ctx.fill();
        
        // Текст на секторах
        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(i * sectorAngle + sectorAngle / 2);
        ctx.fillStyle = "#fff";
        ctx.fillText(topic.title.substring(0, 15), 100, 10);
        ctx.restore();
    });
}

// 3. Логика вращения
document.getElementById('spinBtn').onclick = () => {
    const randomSpin = Math.floor(Math.random() * 360) + 1080; // Минимум 3 оборота
    currentAngle += randomSpin;
    canvas.style.transform = `rotate(${currentAngle}deg)`;
    
    // Эмуляция завершения вращения
    setTimeout(() => {
        const actualAngle = currentAngle % 360;
        const sectorSize = 360 / topics.length;
        const winnerIndex = Math.floor((360 - actualAngle) / sectorSize) % topics.length;
        showTopic(topics[winnerIndex]);
        
        document.getElementById('rerollBtn').classList.remove('hidden');
        document.getElementById('spinBtn').disabled = true;
    }, 4000);
};

function showTopic(topic) {
    document.getElementById('topicDetail').classList.remove('hidden');
    document.getElementById('topicTitle').innerText = topic.title;
    document.getElementById('topicDesc').innerText = topic.description;
    document.getElementById('teamSize').innerText = topic.teamSize;
    document.getElementById('difficulty').innerText = topic.difficulty;
    document.getElementById('topicTask').innerText = topic.task;
}

loadData();
