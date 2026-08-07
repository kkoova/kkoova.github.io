let missionsData = [];

// 1. Загружаем данные из JSON
fetch('data.json')
    .then(response => {
        if (!response.ok) throw new Error("JSON not found");
        return response.json();
    })
    .then(data => {
        missionsData = data.missions;
        console.log("SYSTEM // Data loaded:", missionsData);
        initMap(); // Инициализируем наводку только после загрузки данных
    })
    .catch(err => console.error("SYSTEM // Error loading data:", err));

// 2. Логика предпросмотра (Hover)
function initMap() {
    const nodes = document.querySelectorAll('.topic-node');
    const preview = document.getElementById('hover-preview');

    nodes.forEach(node => {
        // Извлекаем ID из атрибута onclick (например, 'm01_arch')
        const mId = node.getAttribute('onclick').match(/'([^']+)'/)[1];
        const data = missionsData.find(m => m.id === mId);

        if (!data) return;

        node.addEventListener('mouseenter', (e) => {
            document.getElementById('preview-img').src = data.preview_img;
            document.getElementById('preview-title').innerText = data.title;
            document.getElementById('preview-subtitle').innerText = data.subtitle;
            preview.style.display = 'block';
        });

        node.addEventListener('mousemove', (e) => {
            // Смещение превью относительно курсора
            preview.style.left = (e.clientX + 25) + 'px';
            preview.style.top = (e.clientY + 25) + 'px';
        });

        node.addEventListener('mouseleave', () => {
            preview.style.display = 'none';
        });
    });
}

// 3. Открытие миссии (Click)
function openMission(id) {
    // Ждем, пока данные загрузятся, если кликнули слишком быстро
    if (missionsData.length === 0) return;

    const data = missionsData.find(m => m.id === id);
    if (!data) {
        console.error("SYSTEM // Mission not found:", id);
        return;
    }

    // Заполняем интерфейс
    document.getElementById('mission-title').innerText = data.title;
    document.getElementById('godot-frame').src = data.godot_path;
    document.getElementById('tutorial-link').href = data.tutorial_url;

    const stepsCont = document.getElementById('steps-list');
    stepsCont.innerHTML = data.steps.map((step, index) => `
        <div class="step-item">
            <span class="accent">[0${index + 1}]</span> ${step}
        </div>
    `).join('');

    // Показываем оверлей
    document.getElementById('mission-overlay').style.display = 'flex';
}

function closeMission() {
    const overlay = document.getElementById('mission-overlay');
    const iframe = document.getElementById('godot-frame');
    overlay.style.display = 'none';
    iframe.src = ''; // Останавливаем Godot
}