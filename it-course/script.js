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

let config = { topics: [] };
let isSpinning = false;
let currentTopic = null;
let rerollAvailable = true;
let topicStatus = {};
let history = JSON.parse(localStorage.getItem('it_course_history')) || [];

const urlParams = new URLSearchParams(window.location.search);
const ADMIN_UID = "A4x3C68w2tSp65CplZgxEflCeVh11";
let isAdmin = false;

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
        isAdmin = (user.uid === ADMIN_UID);
        if (isAdmin) {
            document.body.classList.add('state-admin');
            roleEl.innerText = 'TEACHER_ADMIN // ROOT';
            
            document.getElementById('student-tools').style.display = 'none';
            if (document.getElementById('report-stud')) document.getElementById('report-stud').style.display = 'none';
            document.getElementById('profile-btn').style.display = 'none';
        } else {
            document.body.classList.remove('state-admin');
            roleEl.innerText = user.displayName ? user.displayName.toUpperCase() : 'DEV_STUDENT';
            
            if (document.getElementById('spinBtn')) document.getElementById('spinBtn').style.display = 'none';
            if (document.getElementById('admin-btn')) document.getElementById('admin-btn').style.display = 'none';
            if (document.getElementById('rerollBtn')) document.getElementById('rerollBtn').style.display = 'none';
            if (document.getElementById('profile-btn')) document.getElementById('profile-btn').style.display = 'inline-block';
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

    console.log(topic.docsUrl)
    const tutorialLink = document.getElementById('tutorial-link');

    tutorialLink.onclick = () => {
        window.location.href = `mission.html?doc=${topic.docsUrl}`;
    };

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

    //document.getElementById('externalDocs').href = topic.docsUrl;
    document.getElementById('app-container').className = 'view-result';
}

window.submitWork = async () => {
    const user = auth.currentUser;
    const repo = document.getElementById('repoLink').value;
    if (!repo) return alert("REPO_REQUIRED");
    if (!currentTopic) return alert("NO_TOPIC_SELECTED");

    try {
        const q = query(
            collection(db, "submissions"), 
            where("githubUid", "==", user.uid), 
            where("topicId", "==", currentTopic.id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            alert("ERROR: YOU_HAVE_ALREADY_SUBMITTED_REPORT_FOR_THIS_TOPIC");
            return;
        }

        await addDoc(collection(db, "submissions"), {
            studentName: user.displayName,
            githubUid: user.uid,
            repository: repo,
            topicId: currentTopic.id,
            topicTitle: currentTopic.title,
            timestamp: serverTimestamp()
        });
        alert("TRANSMISSION_SUCCESSFUL");
        document.getElementById('report-modal').classList.remove('active');
        location.reload();
    } catch (e) { alert("SYNC_ERROR: CHECK_CONSOLE"); }
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
        location.reload();

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

    // 1. Открываем модальное окно и заполняем данные из GitHub
    document.getElementById('profile-modal').classList.add('active');
    document.getElementById('prof-name').innerText = user.displayName ? user.displayName.toUpperCase() : "STUDENT_DEV";
    document.getElementById('prof-email').innerText = user.email || "NO_EMAIL";
    if (user.photoURL) {
        document.getElementById('prof-avatar').src = user.photoURL;
    }

    // 2. Ищем в Firebase все работы, которые сдал именно этот студент
    const list = document.getElementById('prof-list');
    list.innerHTML = `<div class="type-body" style="color:#666; padding: 15px 0;">SEARCHING_LOGBOOK...</div>`;
    
    try {
        const q = query(collection(db, "submissions"), where("githubUid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        list.innerHTML = "";
        let count = 0;

        if (querySnapshot.empty) {
            list.innerHTML = `<div class="type-body" style="color:#888; padding: 15px 0;">NO_MISSIONS_COMPLETED_YET</div>`;
        } else {
            querySnapshot.forEach((doc) => {
                count++;
                const data = doc.data();
                const item = document.createElement('div');
                item.className = "type-body";
                item.style = "padding: 12px 0; border-bottom: 1px dashed rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: center;";
                
                // Красивое отображение: Название темы и ссылка на Гитхаб
                item.innerHTML = `
                    <span>#${data.topicId} // ${data.topicTitle.toUpperCase()}</span>
                    <a href="${data.repository}" target="_blank" class="logout-trigger"">[ REPO ]</a>
                `;
                list.appendChild(item);
            });
        }

        // 3. Считаем процент прохождения курса (например, 3 работы из 10 = 30%)
        document.getElementById('prof-count').innerText = count;
        const totalTopics = config.topics ? config.topics.length : 10;
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

const profBtn = document.getElementById('profile-btn');
if (profBtn) profBtn.onclick = window.openProfile;

document.getElementById('spinBtn').onclick = window.spin;
document.getElementById('github-auth-btn').onclick = window.loginViaGithub;
document.getElementById('logout-btn').onclick = window.logout;

document.getElementById('rerollBtn').onclick = () => {
    if (!rerollAvailable) return;
    
    rerollAvailable = false;
    document.getElementById('rerollBtn').innerText = "[ LOCKED_SYSTEM ]";
    
    // Возвращаемся к колесу и крутим снова
    document.getElementById('app-container').className = 'view-wheel';
    setTimeout(spin, 800); 
};

window.submitFeedWork = async () => {
    const user = auth.currentUser;
    const feed = document.getElementById('feedLink').value;
    if (!feed) return alert("FEED_REQUIRED");

    try {
        const q = query(
            collection(db, "feedback-it"), 
            where("githubUid", "==", user.uid)
        );

        await addDoc(collection(db, "feedback-it"), {
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

window.openReport = () => document.getElementById('report-modal').classList.add('active');
window.closeReport = () => document.getElementById('report-modal').classList.remove('active');
window.startMission = () => {
    document.getElementById('topic-presentation').classList.add('hidden');
    document.getElementById('topic-workspace').classList.remove('hidden');
};


window.openFeedReport = () => document.getElementById('feedback-modal').classList.add('active');
window.closeFeedReport = () => document.getElementById('feedback-modal').classList.remove('active');