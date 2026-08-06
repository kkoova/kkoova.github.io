import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GithubAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
let topicStatus = {};
let history = JSON.parse(localStorage.getItem('it_course_history')) || [];

const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('admin') === 'aaaa';

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
    const overlay = document.getElementById('login-overlay');
    if (user) {
        overlay.classList.remove('active');
        const roleEl = document.getElementById('user-role');
        if (isAdmin) {
            document.body.classList.add('state-admin');
            roleEl.innerText = 'TEACHER_ADMIN';
            document.getElementById('student-tools').style.display = 'none';
        } else {
            roleEl.innerText = user.displayName ? user.displayName.toUpperCase() : 'STUDENT';
            document.getElementById('spinBtn').style.display = 'none';
        }
        init();
    } else {
        overlay.classList.add('active');
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

    const availableTopics = config.topics.filter(t => !topicStatus[t.id]);
    if (availableTopics.length === 0) return alert("ALL_COMPLETED");

    isSpinning = true;
    const targetTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const targetIndex = config.topics.findIndex(t => t.id === targetTopic.id);
    
    const sliceDeg = 360 / config.topics.length;
    const targetCenter = (targetIndex * sliceDeg) + (sliceDeg / 2);
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
    document.getElementById('liveTask').innerText = topic.liveTask;
    document.getElementById('selfTask').innerText = topic.selfTask;
    document.getElementById('teamSize').innerText = topic.teamSize;
    document.getElementById('difficulty').innerText = topic.difficulty;

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

    document.getElementById('externalDocs').href = topic.docsUrl;
    document.getElementById('app-container').className = 'view-result';
}

window.submitWork = async () => {
    const user = auth.currentUser;
    const repo = document.getElementById('repoLink').value;
    if (!repo) return alert("REPO_REQUIRED");

    try {
        await addDoc(collection(db, "submissions"), {
            studentName: user.displayName,
            studentEmail: user.email,
            repository: repo,
            topicId: currentTopic.id,
            topicTitle: currentTopic.title,
            timestamp: serverTimestamp()
        });
        alert("DONE");
        document.getElementById('report-modal').classList.remove('active');
    } catch (e) { alert("SYNC_ERROR"); }
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
        alert("LOCKED");
    } catch (e) { console.error(e); }
};

function updateProgress() {
    const steps = document.querySelectorAll('.step-item');
    const done = document.querySelectorAll('.step-item.completed');
    const percent = (done.length / steps.length) * 100;
    document.getElementById('step-progress').style.width = percent + '%';
}

function updateSystemUI() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toTimeString().split(' ')[0];
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

document.getElementById('spinBtn').onclick = window.spin;
document.getElementById('github-auth-btn').onclick = window.loginViaGithub;

window.openReport = () => document.getElementById('report-modal').classList.add('active');
window.closeReport = () => document.getElementById('report-modal').classList.remove('active');
window.startMission = () => {
    document.getElementById('topic-presentation').classList.add('hidden');
    document.getElementById('topic-workspace').classList.remove('hidden');
};