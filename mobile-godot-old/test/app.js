// ==========================================
// 1. СИСТЕМА БЕЗОПАСНОСТИ (ANTI-CHEAT)
// ==========================================
let violations = 0;
const warningOverlay = document.getElementById('warning-overlay');
const violationCounter = document.getElementById('violation-counter');

// Блокировка выхода
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'Вы уверены, что хотите прервать тестирование? Результаты могут быть аннулированы.';
    return e.returnValue;
});

// Блокировка контекстного меню
document.addEventListener('contextmenu', e => e.preventDefault());

// Слежка за переключением вкладок
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        registerViolation();
    }
});

// Слежка за потерей фокуса (клик вне окна)
window.addEventListener('blur', () => {
    // Небольшая задержка, чтобы не триггерилось при клике на DevTools внутри окна
    setTimeout(() => {
        if (!document.hasFocus()) registerViolation();
    }, 100);
});

function registerViolation() {
    violations++;
    violationCounter.textContent = violations;
    warningOverlay.style.display = 'flex';
}

document.getElementById('resume-btn').addEventListener('click', () => {
    warningOverlay.style.display = 'none';
    // Можно попросить вернуться в фуллскрин
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
    }
});

// Запуск теста
document.getElementById('start-btn').addEventListener('click', async () => {
    try {
        // Требуем полный экран
        await document.documentElement.requestFullscreen();
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('main-shell').style.display = 'block';
        
        // Загружаем вопросы
        await loadQuestions();
    } catch (err) {
        alert('Для прохождения теста необходимо разрешить полноэкранный режим!');
    }
});


// ==========================================
// 2. ЛОГИКА ТЕСТИРОВАНИЯ
// ==========================================
let tasks = [];
let current = 0;
const answers = {};
const app = document.getElementById('app');
const progressFill = document.getElementById('progressFill');
const progressCount = document.getElementById('progressCount');

// Загрузка JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        tasks = await response.json();
        render();
    } catch (e) {
        app.innerHTML = `<div style="color:var(--red);padding:20px;">Ошибка загрузки вопросов: ${e.message}</div>`;
    }
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function codeBlock(lines) {
    return `<div class="codebox"><div class="code-head"><span>GDSCRIPT // SOURCE VIEW</span><span>READ ONLY</span></div><div class="code-lines">${lines.map((l,i)=>`<div class="code-line" data-line="${i}" tabindex="0"><span class="ln">${i+1}</span><span>${esc(l)||' '}</span></div>`).join('')}</div></div>`;
}

function optionsHTML(t, multi = false) {
    return `<div class="section-label">${multi ? 'Select all applicable / можно несколько' : 'Choose one / один вариант'}</div><div class="options">${t.options.map(([k,v])=>`<button class="option" data-value="${esc(k)}"><span class="option-key">${k}</span><span class="option-copy">${v}</span></button>`).join('')}</div>`;
}

function render() {
    const t = tasks[current];
    progressCount.textContent = String(current+1).padStart(2,'0') + ' / ' + tasks.length;
    progressFill.style.width = ((current+1)/tasks.length*100) + '%';
    
    let body = '';
    if (t.code && t.kind !== 'linepick') body += codeBlock(t.code);
    if (t.kind === 'choice' || t.kind === 'multi') body += optionsHTML(t, t.kind === 'multi');
    
    if (t.kind === 'linepick') {
        body += `<div class="section-label">Select suspicious line / нажми на строку</div>${codeBlock(t.code)}`;
    }
    
    if (t.kind === 'reorder') {
        body += `<div class="section-label">Drag to reorder / перетаскивай строки</div><div class="drag-list" id="sortable">${t.items.map((x,i)=>dragItem(x,i)).join('')}</div>`;
    }
    
    if (t.kind === 'tree') {
        body += `<div class="section-label">Scene hierarchy builder / сборка структуры</div><div class="drop-grid">
            <div class="drop-zone" id="treeSlots"><h4>Scene tree / hierarchy</h4>
                ${t.slots.map((s,i)=>`<div class="field"><label>${s}</label><div class="tree-slot" data-slot="${i}" style="min-height:33px;color:#758692;font:11px 'IBM Plex Mono';border:1px dashed #455966;padding:5px;">DROP NODE HERE</div></div>`).join('')}
            </div>
            <div class="drop-zone"><h4>Node pool / available</h4><div class="pool" id="nodePool">${t.pool.map((x,i)=>dragItem(x,i)).join('')}</div></div>
        </div>`;
    }
    
    if (t.kind === 'selects') {
        body += `<div class="section-label">Inspector / configuration</div><div class="select-grid">${t.fields.map((f,i)=>`<div class="field"><label>${f.label}</label><select data-field="${i}"><option value="">— Select value —</option>${f.options.map(o=>`<option>${o}</option>`).join('')}</select></div>`).join('')}</div>`;
    }
    
    if (t.kind === 'match') {
        body += `<div class="section-label">Connect pairs / сопоставь</div><div class="match-list">${t.pairs.map((p,i)=>`<div class="match-row"><span>${esc(p[0])}</span><select data-match="${i}"><option value="">— choose —</option>${t.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select></div>`).join('')}</div>`;
    }

    // НОВЫЙ ТИП: Выбор картинки ноды
    if (t.kind === 'node_pick') {
        body += `<div class="section-label">Choose correct node / выбери правильный узел</div>
        <div class="node-grid">
            ${t.nodes.map(n => `<div class="node-card" data-node="${n.name}"><div class="node-icon">${n.icon}</div><div style="font: 12px 'IBM Plex Mono';">${n.name}</div></div>`).join('')}
        </div>`;
    }

    const context = t.context ? `<div class="context">${t.context}</div>` : '';
    
    app.innerHTML = `
    <section class="card">
        <div class="card-head">
            <div class="task-id">${t.section} <span style="color:#60717e">/ TASK_${String(current+1).padStart(2,'0')}</span></div>
            <div class="task-type">${t.type}</div>
        </div>
        <div class="card-body">
            <h2 class="question">${t.title}</h2>
            <p class="description">${t.desc}</p>
            ${context}
            ${body}
            <div class="note">INPUT BUFFER: <span id="answerState">WAITING FOR RESPONSE</span> · RESPONSE IS NOT GRADED</div>
        </div>
        <div class="actions">
            <div class="action-note">TASK ${String(current+1).padStart(2,'0')} OF ${tasks.length}</div>
            <button class="primary" id="continueBtn" disabled>${current === tasks.length-1 ? 'FINISH TEST' : 'CONTINUE →'}</button>
        </div>
    </section>`;
    
    wire(t);
}

function dragItem(x, i) {
    return `<div class="drag-item" draggable="true" data-item="${esc(x)}" data-id="${i}"><span class="grip">⠿</span><span class="drag-text">${esc(x)}</span><span class="drag-index">${String(i+1).padStart(2,'0')}</span></div>`;
}

function setAnswer(val) {
    answers[current] = val;
    const state = document.getElementById('answerState');
    if (state) state.textContent = 'RESPONSE CAPTURED';
    const btn = document.getElementById('continueBtn');
    if (btn) btn.disabled = false;
}

function wire(t) {
    let selected = new Set();
    
    // Choice / Multi
    if (t.kind === 'choice' || t.kind === 'multi') {
        document.querySelectorAll('.option').forEach(b => b.addEventListener('click', () => {
            if (t.kind === 'choice') {
                document.querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
                selected = new Set([b.dataset.value]);
            } else {
                if (selected.has(b.dataset.value)) selected.delete(b.dataset.value);
                else selected.add(b.dataset.value);
            }
            b.classList.toggle('selected', selected.has(b.dataset.value));
            setAnswer([...selected]);
        }));
    }
    
    // Line Pick
    if (t.kind === 'linepick') {
        document.querySelectorAll('.code-line').forEach(line => line.addEventListener('click', () => {
            document.querySelectorAll('.code-line').forEach(x => x.classList.remove('picked'));
            line.classList.add('picked');
            setAnswer(Number(line.dataset.line) + 1);
        }));
    }

    // Node Pick (Картинки)
    if (t.kind === 'node_pick') {
        document.querySelectorAll('.node-card').forEach(card => card.addEventListener('click', () => {
            document.querySelectorAll('.node-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            setAnswer(card.dataset.node);
        }));
    }
    
    // Selects
    if (t.kind === 'selects') {
        document.querySelectorAll('select[data-field]').forEach(s => s.addEventListener('change', () => {
            const vals = [...document.querySelectorAll('select[data-field]')].map(x => x.value);
            if (vals.every(v => v !== "")) setAnswer(vals); // Требуем заполнить все
        }));
    }
    
    // Match
    if (t.kind === 'match') {
        document.querySelectorAll('select[data-match]').forEach(s => s.addEventListener('change', () => {
            const vals = [...document.querySelectorAll('select[data-match]')].map(x => x.value);
            if (vals.every(v => v !== "")) setAnswer(vals);
        }));
    }
    
    // Reorder
    if (t.kind === 'reorder') {
        const list = document.getElementById('sortable');
        enableDrag(list, 'reorder');
        list.addEventListener('drop', () => setAnswer([...list.querySelectorAll('.drag-item')].map(x => x.dataset.item)));
        list.addEventListener('pointerup', () => {
            setTimeout(() => {
                if (list.dataset.touched === '1') setAnswer([...list.querySelectorAll('.drag-item')].map(x => x.dataset.item));
            }, 0);
        });
    }

    // ДЕРЕВО НОД (D&D) - ИСПРАВЛЕН БАГ С НАЛОЖЕНИЕМ
    if (t.kind === 'tree') {
        const pool = document.getElementById('nodePool');
        const slots = [...document.querySelectorAll('.tree-slot')];
        enableDrag(pool, 'pool');
        
        let placed = {};

        slots.forEach(slot => {
            slot.addEventListener('dragover', e => e.preventDefault());
            
            slot.addEventListener('drop', e => {
                e.preventDefault();
                if (slot.dataset.filled === "true") return;

                const raw = e.dataTransfer.getData('text/plain');
                if (!raw) return;

                const item = JSON.parse(raw);
                if (placed[item.id]) return;

                placed[item.id] = item.text;
                slot.textContent = item.text;
                slot.style.color = '#d0f09a';
                slot.style.border = '1px solid #a8d66d';
                slot.dataset.filled = "true"; // Блокируем слот

                const source = pool.querySelector(`[data-id="${item.id}"]`);
                if (source) source.style.display = 'none';
                
                setAnswer({...placed});
            });
        });

        let pending = null;
        pool.querySelectorAll('.drag-item').forEach(el => el.addEventListener('click', () => {
            pending = el;
            pool.querySelectorAll('.drag-item').forEach(x => x.style.outline = '');
            el.style.outline = '1px solid var(--green)';
        }));
        
        slots.forEach(slot => slot.addEventListener('click', () => {
            if (!pending || slot.dataset.filled === "true") return;
            const id = pending.dataset.id;
            if (placed[id]) return;
            
            placed[id] = pending.dataset.item;
            slot.textContent = pending.dataset.item;
            slot.style.color = '#d0f09a';
            slot.dataset.filled = "true";
            
            pending.style.display = 'none';
            pending = null;
            setAnswer({...placed});
        }));
    }
    
    const btn = document.getElementById('continueBtn');
    btn.addEventListener('click', () => {
        if (btn.disabled) return;
        if (current < tasks.length - 1) {
            current++;
            render();
        } else {
            showComplete();
        }
    });
}

function enableDrag(container) {
    let dragging = null;
    container.querySelectorAll('.drag-item').forEach(el => {
        el.addEventListener('dragstart', e => {
            dragging = el;
            el.classList.add('dragging');
            e.dataTransfer.setData('text/plain', JSON.stringify({id: el.dataset.id, text: el.dataset.item}));
            e.dataTransfer.effectAllowed = 'move';
        });
        
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            container.querySelectorAll('.drag-item').forEach(x => x.classList.remove('over'));
        });
        
        el.addEventListener('dragover', e => {
            e.preventDefault();
            if (el !== dragging && container.id === 'sortable') el.classList.add('over');
        });
        
        el.addEventListener('dragleave', () => el.classList.remove('over'));
        
        el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('over');
            if (!dragging || dragging === el || container.id !== 'sortable') return;
            
            const rect = el.getBoundingClientRect();
            const after = e.clientY > rect.top + rect.height / 2;
            container.insertBefore(dragging, after ? el.nextSibling : el);
            container.dataset.touched = '1';
        });
    });
    container.addEventListener('dragover', e => e.preventDefault());
}

function showComplete() {
    progressCount.textContent = `${tasks.length} / ${tasks.length}`;
    progressFill.style.width = '100%';
    
    // Убираем защиту при завершении теста
    window.removeEventListener('beforeunload', (e) => e.preventDefault());
    
    app.innerHTML = `
    <section class="card">
        <div class="complete">
            <div class="complete-mark">[ ${tasks.length} / ${tasks.length} ]</div>
            <div class="kicker">Sequence terminated // input saved locally</div>
            <h2>TEST SESSION COMPLETE</h2>
            <p>Все задания пройдены. Вы можете закрыть эту страницу.</p>
            <div style="margin-top:25px;color:#7d909c;font:10px 'IBM Plex Mono';letter-spacing:.08em">GODOT SYSTEM CHECK // END OF TRANSMISSION</div>
        </div>
    </section>`;
}