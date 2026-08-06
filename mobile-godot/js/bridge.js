
// Объект для управления связью
const GodotBridge = {
    // 1. Запуск миссии (загрузка iframe)
    launchMission: function(missionPath) {
        const viewport = document.getElementById('mission-iframe');
        const container = document.querySelector('.mission-viewport');
        
        viewport.src = missionPath; // Путь к экспортированному index.html из Godot
        container.classList.add('active');
        
        console.log("SYSTEM // Initializing Mission at: " + missionPath);
    },

    // 2. Слушатель сигналов от Godot
    initListener: function() {
        window.addEventListener("message", (event) => {
            // Проверяем данные от Godot
            if (event.data.type === "MISSION_COMPLETE") {
                this.onMissionComplete(event.data.missionId);
            }
        });
    },

    onMissionComplete: function(id) {
        alert("ACCESS GRANTED // Mission " + id + " Completed!");
        // Тут в будущем будет отправка в БД или GitHub
        document.querySelector(`.topic-node[data-id="${id}"]`).classList.add('completed');
    }
};

GodotBridge.initListener();