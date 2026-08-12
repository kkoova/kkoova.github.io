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

const ADMIN_UID = "A4x3C68w2tSp65CplZgxEflCeVh1";
let isAdmin = false;

let missionsData = [];

async function init() {
    try {
        const res = await fetch('data.json');
        const data = await res.json();
        missionsData = data.missions;
        
        updateSystemUI();
        setInterval(updateSystemUI, 1000);
        generateDynamicMap(missionsData);
        //console.log(missionsData);
    } catch (e) { console.error(e); }
}

window.loginViaGithub = () => {
    signInWithPopup(auth, provider).catch(e => alert("AUTH_ERROR"));
};

onAuthStateChanged(auth, (user) => {
    const overlay = document.getElementById('login-overlay');
    if (user) {
        overlay.classList.remove('active');
        const roleEl = document.getElementById('user-role');
        isAdmin = (user.uid === ADMIN_UID);
        if (isAdmin) {
            document.body.classList.add('state-admin');
            roleEl.innerText = 'TEACHER_ADMIN // ROOT';
        } else {
            document.body.classList.remove('state-admin');
            roleEl.innerText = user.displayName ? user.displayName.toUpperCase() : 'DEV_STUDENT';
        }
        init();
    } else {
        overlay.classList.add('active');
    }
});

function updateSystemUI() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toTimeString().split(' ')[0];
}

function generateDynamicMap(missions) {
    const container = document.getElementById('nodes-container');
    const svg = document.getElementById('connections-svg');
    
    container.innerHTML = '';
    svg.innerHTML = '';

    const nodesPerRow = 3;
    const nodePositions = [];

    missions.forEach((mission, index) => {
        const row = Math.floor(index / nodesPerRow);
        let col = index % nodesPerRow;
        if (row % 2 !== 0) col = (nodesPerRow - 1) - col;

        // --- ДОБАВЛЯЕМ ХАОС ---
        // Базовая позиция + случайное смещение до 10% в любую сторону
        const baseX = 20 + (col * 30);
        const baseY = 20 + (row * 25);
        
        const finalX = baseX + (Math.random() * 14 - 7);
        const finalY = baseY + (Math.random() * 14 - 7);

        nodePositions.push({ x: finalX, y: finalY, id: mission.id });

        const nodeWrapper = document.createElement('div');
        nodeWrapper.className = 'node-wrapper';
        nodeWrapper.style.left = `${finalX}%`;
        nodeWrapper.style.top = `${finalY}%`;

        nodeWrapper.innerHTML = `
            <div class="topic-node" data-id="${mission.id}">
                <div class="node-hex">${String(index + 1).padStart(2, '0')}</div>
                <div class="node-label">${mission.title}</div>
            </div>
        `;
        container.appendChild(nodeWrapper);
    });

    // --- РИСУЕМ ЗАКРУГЛЕННЫЕ КРИВЫЕ (Bézier) ---
    for (let i = 0; i < nodePositions.length - 1; i++) {
        const p1 = nodePositions[i];
        const p2 = nodePositions[i + 1];

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
        
        const dx = Math.abs(x2 - x1);
        const cx1 = x1 + dx * 0.5;
        const cy1 = y1;
        const cx2 = x2 - dx * 0.5;
        const cy2 = y2;

        const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
        
        path.setAttribute("d", d);
        path.setAttribute("vector-effect", "non-scaling-stroke");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("preserveAspectRatio", "none");

        path.setAttribute("id", `line-${i}`);
        svg.appendChild(path);
    }

    const totalRows = Math.ceil(missions.length / nodesPerRow);
    document.getElementById('node-graph').style.height = `${totalRows * 25 + 20}vh`;
    
    bindNodeEvents();
}

// 3. Подключение интерактивности
function bindNodeEvents() {
    const nodes = document.querySelectorAll('.topic-node');
    const preview = document.getElementById('hover-preview');

    nodes.forEach(node => {
        const missionId = node.getAttribute('data-id');
        const data = missionsData.find(m => m.id === missionId);
        if (!data) return;

        node.addEventListener('click', () => openMission(missionId));

        node.addEventListener('mouseenter', () => {
            document.getElementById('preview-img').src = data.preview_img || '';
            document.getElementById('preview-title').innerText = data.title;
            document.getElementById('preview-subtitle').innerText = data.subtitle || '';
            preview.style.display = 'block';

            const index = Array.from(nodes).indexOf(node);
            const prevLine = document.getElementById(`line-${index-1}`);
            const nextLine = document.getElementById(`line-${index}`);
            
            if(prevLine) prevLine.classList.add('line-active');
            if(nextLine) nextLine.classList.add('line-active');
        });

        node.addEventListener('mousemove', (e) => {
            preview.style.left = (e.clientX + 20) + 'px';
            preview.style.top = (e.clientY + 20) + 'px';
        });

        node.addEventListener('mouseleave', () => {
            // ИСПРАВЛЕНО: Ищем все элементы с классом line-active и убираем его
            document.querySelectorAll('.line-active').forEach(l => {
                l.classList.remove('line-active');
            });
            preview.style.display = 'none';
        });
    });
}

// 4. Открытие миссии (Модалка Godot + Шаги)
function openMission(id) {
    const data = missionsData.find(m => m.id === id);
    if (!data) return;

    document.getElementById('mission-title').innerText = data.title;
    document.getElementById('godot-frame').src = data.godot_path;
    document.getElementById('tutorial-link').href = data.tutorial_url;

    const stepsCont = document.getElementById('steps-list');
    stepsCont.innerHTML = (data.steps || []).map((step, index) => `
        <div class="step-item">
            <span class="accent">[0${index + 1}]</span> ${step}
        </div>
    `).join('');

    document.getElementById('mission-overlay').style.display = 'flex';
}

// 5. Закрытие модалки
function closeMission() {
    const overlay = document.getElementById('mission-overlay');
    const iframe = document.getElementById('godot-frame');
    overlay.style.display = 'none';
    iframe.src = ''; 
}

window.logout = () => {
    signOut(auth).then(() => {
        console.log("System logged out");
    }).catch((error) => {
        console.error("Logout error:", error);
    });
};

document.getElementById('github-auth-btn').onclick = window.loginViaGithub;
document.getElementById('logout-btn').onclick = window.logout;