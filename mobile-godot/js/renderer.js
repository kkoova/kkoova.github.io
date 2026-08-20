function formatText(text) {
    if (!text) return "";
    return text.replace(/\*\*(.*?)\*\*/g, '<span class="text-accent">$1</span>');
}

function getGodotColor(type) {
    if (type.includes('Control') || type.includes('Button') || type.includes('Container')) return '#4ed162'; // Зеленый
    if (type.includes('2D')) return '#4e70d1'; // Синий
    if (type.includes('Spatial') || type.includes('3D')) return '#d14e4e'; // Красный
    return '#888';
}

function renderLesson(data) {
    const container = document.getElementById('doc-content');

    document.getElementById('unit-label').innerText = data.unit;
    document.getElementById('unit-title').innerText = data.title;

    data.phases.forEach(phase => {
        const card = document.createElement('div');
        card.className = 'step-card active';
        
        let html = `
            <div class="phase-badge">${phase.id.toUpperCase()}</div>
            <div class="step-label yellow">${phase.label}</div>
            <h2 class="matrix-text">${phase.header}</h2>
            <div class="step-body">
        `;

        phase.items.forEach(item => {
            if (item.type === 'text') {
                html += `<p class="type-body description">${formatText(item.val)}</p>`;
            } 
            else if (item.type === 'button') {
                html += `<button class="logout-trigger white" onclick="window.open('${item.url}')"><span class="dot"></span> [  ${item.text}  ]</button>`;
            }
            else if (item.type === 'config') {
                html += `<div class="system-log"><div class="window-settings">`;
                item.data.forEach(row => {
                    html += `
                        <div class="setting-row">
                            <div class="s-label">${formatText(row[0])}:</div>
                            <div class="s-value">${formatText(row[1])}</div>
                        </div>`;
                });
                html += `</div></div>`;
            }
            else if (item.type === 'tip') {
                html += `<div class="tip-box type-body"><span class="accent">TIP:</span> ${formatText(item.val)}</div>`;
            }
            else if (item.type === 'instruction') {
                html += `<div class="instruction-block">${formatText(item.val)}</div>`;
            }
            else if (item.type === 'timer') {
                const isAdmin = localStorage.getItem('userRole') === 'TEACHER_ADMIN';
                
                html += `
                    <div class="timer-trigger-box">
                        <div class="type-body yellow">SESSION_TIMER // ${item.minutes} MIN</div>
                        ${isAdmin ? `
                            <button class="logout-trigger white" onclick="triggerGlobalTimer(${item.minutes}, ${JSON.stringify(item.goals).replace(/"/g, '&quot;')})">
                                [ START_GLOBAL_COUNTDOWN ]
                            </button>
                        ` : `<p class="type-body" style="opacity:0.5">Ожидание команды преподавателя...</p>`}
                    </div>`;
            }
            else if (item.type === 'grid') {
                let gridHtml = `<div class="steps-grid">`;
                item.items.forEach((text, i) => {
                    gridHtml += `
                        <div class="grid-step">
                            <span class="step-num">0${i+1}</span>
                            <p class="type-body">${formatText(text)}</p>
                        </div>`;
                });
                gridHtml += `</div>`;
                html += gridHtml;
            }
            else if (item.type === 'tree') {
                let treeHtml = `<div class="scene-tree-box">`;
                
                item.nodes.forEach((node, index) => {
                    const nextNode = item.nodes[index + 1];
                    const hasChildren = nextNode && nextNode.level > node.level;
                    
                    // Считаем отступ только для отрисовки линий, 
                    // но основную вложенность теперь делает CSS группы
                    const offset = node.level * 10; 

                    treeHtml += `
                        <div class="tree-node ${hasChildren ? 'has-children' : ''}" 
                            onclick="${hasChildren ? 'toggleTreeNode(this)' : ''}">
                            
                            <div class="tree-toggle">${hasChildren ? '▾' : ''}</div>
                            <div class="node-icon" style="background: ${getGodotColor(node.type)}"></div>
                            <div class="node-info">
                                <span class="node-name">${node.name}</span>
                                <span class="node-type">${node.type}</span>
                            </div>
                        </div>`;
                        
                    // Если следующий узел глубже, открываем группу
                    if (hasChildren) {
                        treeHtml += `<div class="tree-group">`;
                    }
                    
                    // Если следующий узел выше уровнем, закрываем нужное кол-во групп
                    if (nextNode && nextNode.level < node.level) {
                        const diff = node.level - nextNode.level;
                        treeHtml += "</div>".repeat(diff);
                    }
                    
                    // Если это последний узел, закрываем все открытые группы
                    if (!nextNode && node.level > 0) {
                        treeHtml += "</div>".repeat(node.level);
                    }
                });
                
                treeHtml += `</div>`;
                html += treeHtml;
            }
            else if (item.type === 'code') {
                const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
                
                // Применяем подсветку синтаксиса
                const highlighted = highlightGDScript(item.code.trim());

                html += `
                    <div class="code-container">
                        <div class="code-header">
                            <span class="code-title">${item.title || 'SCRIPT'}</span>
                            <button class="copy-btn" onclick="copyCode('${codeId}', this)">COPY</button>
                        </div>
                        <pre id="${codeId}"><code>${highlighted}</code></pre>
                    </div>`;
            }
            else if (item.type === 'image') {
                html += `
                    <div class="tutorial-image-container">
                        <img src="${item.url}" alt="${item.caption || 'Godot Screenshot'}" loading="lazy">
                        ${item.caption ? `<div class="image-caption">${item.caption}</div>` : ''}
                    </div>`;
            }
        });

        //html += `<button class="logout-trigger white" onclick="markDone('${phase.id}')">[ NEXT_PHASE ]</button>`;
        card.innerHTML = html;
        container.appendChild(card);
    });
}

function highlightGDScript(code) {
    if (!code) return "";

    return code
        // 1. Сначала строки (в кавычках) - зеленый Godot
        .replace(/(['"].*?['"])/g, '<span class="code-string">$1</span>')
        
        // 2. Комментарии (все, что после #) - серый
        .replace(/(#.*)/g, '<span class="code-comment">$1</span>')
        
        // 3. Функции (после func) - желтый акцент
        .replace(/\b(func)\s+(\w+)/g, '<span class="code-keyword">$1</span> <span class="code-func">$2</span>')
        
        // 4. Ключевые слова (extends, var, if, и т.д.) - белый/жирный
        .replace(/\b(extends|var|export|onready|preload|void|return|if|else|for|while|match)\b/g, '<span class="code-keyword">$1</span>')
        
        // 5. Аннотации (@export, @onready) - оранжевый/акцентный
        .replace(/(@\w+)/g, '<span class="code-annotation">$1</span>');
}

function copyCode(elementId, btn) {
    const codeText = document.getElementById(elementId).innerText;
    
    navigator.clipboard.writeText(codeText).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "COPIED!";
        btn.style.borderColor = "#4ed162";
        btn.style.color = "#4ed162";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.borderColor = "";
            btn.style.color = "";
        }, 2000);
    });
}

function toggleTreeNode(element) {
    element.classList.toggle('collapsed');
}

window.renderLesson = renderLesson;
window.formatText = formatText;