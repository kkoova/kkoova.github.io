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

const ADMIN_UID = "A4x3C68w2tSp65CplZgxEflCeVh11";
let isAdmin = false;
let currentTopic = null;
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

function closeMission() {
    const overlay = document.getElementById('mission-overlay');
    const iframe = document.getElementById('godot-frame');
    overlay.style.display = 'none';
    iframe.src = ''; 
}

function openMission(id) {
    const data = missionsData.find(m => m.id === id);
    if (!data) return;
    currentTopic = data;
    console.log(currentTopic)

    document.getElementById('mission-title').innerText = data.title;
    document.getElementById('godot-frame').src = data.godot_path;

    const stepsCont = document.getElementById('steps-list');
    const tutorialLink = document.getElementById('tutorial-link');
    
    stepsCont.innerHTML = '';
    data.steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item type-body';
        div.innerHTML = `<div class="checkbox-custom"></div><span>${step}</span>`;
        div.onclick = () => {
            div.classList.toggle('completed');
            updateProgress();
        };
        stepsCont.appendChild(div);
    });

    tutorialLink.onclick = () => {
        window.location.href = `mission.html?doc=${data.tutorial_url}`;
    };
    
    document.getElementById('mission-overlay').style.display = 'flex';
    
}

function updateProgress() {
    const steps = document.querySelectorAll('.step-item');
    const done = document.querySelectorAll('.step-item.completed');
    const percent = (done.length / steps.length) * 100;
    document.getElementById('step-progress').style.width = percent + '%';
}

window.submitWork = async () => {
    const user = auth.currentUser;
    const repo = document.getElementById('repoLink').value;
    if (!repo) return alert("REPO_REQUIRED");
    if (!currentTopic) return alert("NO_TOPIC_SELECTED");

    try {
        const q = query(
            collection(db, "submissions-godot"), 
            where("githubUid", "==", user.uid), 
            where("topicId", "==", currentTopic.id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            alert("ERROR: YOU_HAVE_ALREADY_SUBMITTED_REPORT_FOR_THIS_TOPIC");
            return;
        }

        await addDoc(collection(db, "submissions-godot"), {
            studentName: user.displayName,
            githubUid: user.uid,
            repository: repo,
            topicId: currentTopic.id,
            timestamp: serverTimestamp()
        });
        alert("TRANSMISSION_SUCCESSFUL");
        document.getElementById('report-modal').classList.remove('active');
        location.reload();
    } catch (e) { alert("SYNC_ERROR: CHECK_CONSOLE"); }
};

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

    document.getElementById('profile-modal').classList.add('active');
    document.getElementById('prof-name').innerText = user.displayName ? user.displayName.toUpperCase() : "STUDENT_DEV";
    document.getElementById('prof-email').innerText = user.email || "NO_EMAIL";
    if (user.photoURL) {
        document.getElementById('prof-avatar').src = user.photoURL;
    }

    const list = document.getElementById('prof-list');
    list.innerHTML = `<div class="type-body" style="color:#666; padding: 15px 0;">SEARCHING_LOGBOOK...</div>`;
    
    try {
        const q = query(collection(db, "submissions-godot"), where("githubUid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        list.innerHTML = "";
        let count = 0;

        if (querySnapshot.empty) {
            list.innerHTML = `<div class="type-body" style="color:#888; padding: 15px 0;">NO_MISSIONS_COMPLETED_YET</div>`;
        } else {
            querySnapshot.forEach((doc) => {
                count++;
                const data = doc.data();
                console.log(data)
                const item = document.createElement('div');
                item.className = "type-body";
                item.style = "padding: 12px 0; border-bottom: 1px dashed rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: center;";
                
                item.innerHTML = `
                    <span>#${data.topicId}</span>
                    <a href="${data.repository}" target="_blank" class="logout-trigger"">[ REPO ]</a>
                `;
                list.appendChild(item);
            });
        }

        document.getElementById('prof-count').innerText = count;
        const totalTopics = missionsData ? missionsData.length : 10;
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

window.submitFeedWork = async () => {
    const user = auth.currentUser;
    const feed = document.getElementById('feedLink').value;
    if (!feed) return alert("FEED_REQUIRED");

    try {
        const q = query(
            collection(db, "feedback-godot"), 
            where("githubUid", "==", user.uid)
        );

        await addDoc(collection(db, "feedback-godot"), {
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

const profBtn = document.getElementById('profile-btn');
if (profBtn) profBtn.onclick = window.openProfile;

document.getElementById('github-auth-btn').onclick = window.loginViaGithub;
document.getElementById('logout-btn').onclick = window.logout;

window.openReport = () => document.getElementById('report-modal').classList.add('active');
window.closeReport = () => document.getElementById('report-modal').classList.remove('active');

window.openFeedReport = () => document.getElementById('feedback-modal').classList.add('active');
window.closeFeedReport = () => document.getElementById('feedback-modal').classList.remove('active');