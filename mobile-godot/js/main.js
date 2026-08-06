function openMission(missionId) {
    const overlay = document.getElementById('mission-overlay');
    const iframe = document.getElementById('godot-frame');
    const title = document.getElementById('mission-title');

    // Путь к твоим экспортированным проектам
    // Например: missions/m01_arch/index.html
    const missionPath = `missions/${missionId}/index.html`;
    
    title.innerText = `INITIALIZING // ${missionId.toUpperCase()}`;
    iframe.src = missionPath;
    overlay.style.display = 'flex';
}

function closeMission() {
    const overlay = document.getElementById('mission-overlay');
    const iframe = document.getElementById('godot-frame');
    
    overlay.style.display = 'none';
    iframe.src = ''; // Очищаем, чтобы остановить музыку/процессы Godot
}

// Слушаем сообщения от Godot
window.addEventListener("message", (event) => {
    if (event.data.type === "MISSION_COMPLETE") {
        console.log("Mission Success:", event.data.missionId);
        // Тут можно добавить визуальный эффект "Завершено" на узле
        alert("ACCESS GRANTED: Mission Complete!");
    }
});