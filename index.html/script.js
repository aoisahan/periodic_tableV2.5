// STATE
let state = {
    selected: null,
    category: null,
    compare: [],
    favorites: JSON.parse(localStorage.getItem('fav') || '[]'),
    theme: 'dark',
    sound: true,
    quiz: { score: 0, num: 0, time: 30, level: 'easy' },
    anim: { speed: 1, paused: false, zoom: 1 },
    scene: null,
    renderer: null,
    animId: null
};

// INIT
document.addEventListener('DOMContentLoaded', init);

function init() {
    renderTable();
    renderCategories();
    renderCharts();
    setupEvents();
    toast('Welcome! 🎉');
}

// RENDER TABLE
function renderTable() {
    const html = ELEMENTS.map(el => `
        <div class="element ${state.category && el.cat !== state.category ? 'dimmed' : ''}"
             style="grid-column:${el.g||'auto'};grid-row:${el.p};border-color:${el.c};color:${el.c}"
             onclick='showElement(${JSON.stringify(el).replace(/'/g,"&apos;")})'>
            <div class="num">${el.num}</div>
            <div class="sym">${el.s}</div>
            <div class="name">${el.n}</div>
            <div class="mass">${el.m}</div>
        </div>
    `).join('');
    document.getElementById('table').innerHTML = html;
}

// RENDER CATEGORIES
function renderCategories() {
    const html = Object.entries(CATS).map(([k, v]) => `
        <button class="cat-btn ${state.category === k ? 'active' : ''}"
                style="border-color:${v.color};color:${v.color}"
                onclick="filterCat('${k}')">
            ${v.name}
        </button>
    `).join('');
    document.getElementById('categories').innerHTML = html;
}

// RENDER CHARTS
function renderCharts() {
    const reactive = [...ELEMENTS].sort((a,b) => b.r - a.r).slice(0,6);
    const heavy = [...ELEMENTS].sort((a,b) => b.m - a.m).slice(0,6);
    const light = [...ELEMENTS].sort((a,b) => a.m - b.m).slice(0,6);
    
    const html = `
        <h2 style="text-align:center;font-family:Orbitron;color:var(--accent);margin-bottom:2rem;">📊 Element Rankings</h2>
        <div class="chart-grid">
            <div class="chart-card">
                <h3>🔥 Most Reactive</h3>
                ${reactive.map(el => `
                    <div class="chart-item" style="border-left-color:${el.c}" onclick='showElement(${JSON.stringify(el).replace(/'/g,"&apos;")})'>
                        <span style="color:${el.c}">${el.num}. ${el.s} - ${el.n}</span>
                        <span>⚡ ${el.r}/10</span>
                    </div>
                `).join('')}
            </div>
            <div class="chart-card">
                <h3>⚖️ Heaviest</h3>
                ${heavy.map(el => `
                    <div class="chart-item" style="border-left-color:${el.c}" onclick='showElement(${JSON.stringify(el).replace(/'/g,"&apos;")})'>
                        <span style="color:${el.c}">${el.num}. ${el.s} - ${el.n}</span>
                        <span>${el.m} amu</span>
                    </div>
                `).join('')}
            </div>
            <div class="chart-card">
                <h3>🪶 Lightest</h3>
                ${light.map(el => `
                    <div class="chart-item" style="border-left-color:${el.c}" onclick='showElement(${JSON.stringify(el).replace(/'/g,"&apos;")})'>
                        <span style="color:${el.c}">${el.num}. ${el.s} - ${el.n}</span>
                        <span>${el.m} amu</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.getElementById('charts').innerHTML = html;
}

// SHOW ELEMENT
function showElement(el) {
    if (state.compare.length > 0 && state.compare.length < 2) {
        state.compare.push(el);
        updateCompare();
        if (state.compare.length === 2) toast('Comparison ready!');
        return;
    }
    
    state.selected = el;
    document.getElementById('dSymbol').textContent = el.s;
    document.getElementById('dSymbol').style.color = el.c;
    document.getElementById('dName').textContent = el.n;
    document.getElementById('dCategory').textContent = CATS[el.cat].name;
    
    document.getElementById('infoGrid').innerHTML = `
        <div class="info-item"><div class="label">Number</div><div class="value">${el.num}</div></div>
        <div class="info-item"><div class="label">Mass</div><div class="value">${el.m}</div></div>
        <div class="info-item"><div class="label">Group</div><div class="value">${el.g||'N/A'}</div></div>
        <div class="info-item"><div class="label">Period</div><div class="value">${el.p}</div></div>
    `;
    
    document.getElementById('fact').innerHTML = `<strong>💡 ${el.f}</strong>`;
    document.getElementById('favDetailBtn').className = 'fav-btn' + (state.favorites.includes(el.s) ? ' active' : '');
    
    document.getElementById('detailModal').classList.add('active');
    switchTab('3d');
    setTimeout(() => render3D(el), 100);
    calculate();
}

// 3D RENDERING
function render3D(el) {
    const canvas = document.getElementById('canvas3d');
    if (state.animId) cancelAnimationFrame(state.animId);
    if (state.renderer) state.renderer.dispose();
    
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(state.theme === 'dark' ? 0x0a0a0f : 0xf5f5fa);
    
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 8 * state.anim.zoom;
    
    state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    state.renderer.setSize(450, 450);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    state.scene.add(ambient);
    
    const light1 = new THREE.PointLight(0xffffff, 1.5);
    light1.position.set(5, 5, 5);
    state.scene.add(light1);
    
    const light2 = new THREE.PointLight(el.c, 1.2);
    light2.position.set(-5, -5, 5);
    state.scene.add(light2);
    
    // Nucleus
    const nucleus = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 32, 32),
        new THREE.MeshPhongMaterial({ color: el.c, emissive: el.c, emissiveIntensity: 0.5 })
    );
    state.scene.add(nucleus);
    
    // Glow
    for (let i = 0; i < 3; i++) {
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(1 + i * 0.3, 24, 24),
            new THREE.MeshBasicMaterial({ color: el.c, transparent: true, opacity: 0.1 })
        );
        state.scene.add(glow);
        glow.userData = { glow: true, speed: 0.002 - i * 0.0005 };
    }
    
    // Electrons
    const shells = Math.min(7, Math.ceil(el.num / 8));
    const radii = [2, 3, 4, 5, 6, 7, 8];
    
    for (let s = 0; s < shells; s++) {
        const r = radii[s];
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.03, 16, 100),
            new THREE.MeshBasicMaterial({ color: 0x4466aa, transparent: true, opacity: 0.4 })
        );
        ring.rotation.x = Math.PI / 2 + s * 0.3;
        ring.rotation.y = s * 0.4;
        state.scene.add(ring);
        ring.userData = { shell: true };
        
        const elecsInShell = Math.min(8, el.num - s * 8);
        for (let e = 0; e < elecsInShell; e++) {
            const elec = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.6 })
            );
            const angle = (e / elecsInShell) * Math.PI * 2;
            elec.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
            state.scene.add(elec);
            elec.userData = { electron: true, shell: s, angle, r, speed: 0.3 + s * 0.1 };
        }
    }
    
    let time = 0;
    function animate() {
        if (!state.anim.paused) {
            state.animId = requestAnimationFrame(animate);
            time += 0.01 * state.anim.speed;
            
            nucleus.rotation.y += 0.01 * state.anim.speed;
            nucleus.rotation.x += 0.004 * state.anim.speed;
            
            state.scene.children.forEach(obj => {
                if (obj.userData.glow) {
                    obj.rotation.y -= obj.userData.speed * state.anim.speed;
                } else if (obj.userData.shell) {
                    obj.rotation.z += 0.004 * state.anim.speed;
                } else if (obj.userData.electron) {
                    const { shell, angle, r, speed } = obj.userData;
                    const a = angle + time * speed;
                    obj.position.x = Math.cos(a) * r;
                    obj.position.y = Math.sin(a) * r;
                    obj.rotation.y += 0.1 * state.anim.speed;
                }
            });
            
            camera.position.z = 8 * state.anim.zoom;
            state.renderer.render(state.scene, camera);
        }
    }
    animate();
}

// CALCULATOR
function calculate() {
    if (!state.selected) return;
    const atoms = parseInt(document.getElementById('atomCount')?.value || 1);
    const el = state.selected;
    const protons = el.num * atoms;
    const electrons = el.num * atoms;
    const neutrons = Math.round((el.m - el.num) * atoms);
    
    document.getElementById('calcResults').innerHTML = `
        <div class="calc-row"><strong>Protons:</strong> ${protons.toLocaleString()}</div>
        <div class="calc-row"><strong>Electrons:</strong> ${electrons.toLocaleString()}</div>
        <div class="calc-row"><strong>Neutrons:</strong> ${neutrons.toLocaleString()}</div>
        <div class="calc-row"><strong>Total:</strong> ${(protons + electrons + neutrons).toLocaleString()}</div>
    `;
}

// TABS
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
}

// CONTROLS
function togglePause() {
    state.anim.paused = !state.anim.paused;
    if (!state.anim.paused && state.selected) render3D(state.selected);
    toast(state.anim.paused ? 'Paused' : 'Playing');
}

function changeSpeed() {
    state.anim.speed = state.anim.speed === 1 ? 2 : state.anim.speed === 2 ? 0.5 : 1;
    toast(`Speed: ${state.anim.speed}x`);
}

function toggleZoom() {
    state.anim.zoom = state.anim.zoom === 1 ? 0.7 : state.anim.zoom === 0.7 ? 1.3 : 1;
    toast(`Zoom: ${state.anim.zoom}x`);
}

function speak() {
    if (!state.selected || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(state.selected.n);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
    toast('🔊 ' + state.selected.n);
}

// FILTER
function filterCat(cat) {
    state.category = state.category === cat ? null : cat;
    renderTable();
    renderCategories();
}

// SEARCH
document.getElementById('search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.getElementById('clearSearch').className = q ? 'show' : '';
    document.querySelectorAll('.element').forEach(el => {
        const text = el.textContent.toLowerCase();
        el.classList.toggle('dimmed', q && !text.includes(q));
    });
});

document.getElementById('clearSearch')?.addEventListener('click', () => {
    document.getElementById('search').value = '';
    document.getElementById('clearSearch').className = '';
    document.querySelectorAll('.element').forEach(el => el.classList.remove('dimmed'));
});

// COMPARE
document.getElementById('compareBtn')?.addEventListener('click', () => {
    state.compare = [];
    document.getElementById('compareModal').classList.add('active');
    toast('Click 2 elements to compare');
});

function updateCompare() {
    state.compare.forEach((el, i) => {
        document.getElementById(`comp${i+1}`).innerHTML = `
            <h3 style="color:${el.c}">${el.s}</h3>
            <p>${el.n}</p>
            <p>Mass: ${el.m}</p>
            <p>Number: ${el.num}</p>
        `;
    });
    
    if (state.compare.length === 2) {
        const [a, b] = state.compare;
        document.getElementById('compDetails').innerHTML = `
            <h3>Comparison</h3>
            <div class="calc-row"><strong>Mass Difference:</strong> ${Math.abs(a.m - b.m).toFixed(2)} amu</div>
            <div class="calc-row"><strong>Reactivity:</strong> ${a.s}=${a.r} vs ${b.s}=${b.r}</div>
            <div class="calc-row"><strong>Period:</strong> ${a.s}=${a.p} vs ${b.s}=${b.p}</div>
        `;
    }
}

function closeCompare() {
    document.getElementById('compareModal').classList.remove('active');
    state.compare = [];
}

// FAVORITES
document.getElementById('favBtn')?.addEventListener('click', () => {
    document.getElementById('favPanel').classList.toggle('active');
    updateFavList();
});

document.getElementById('favDetailBtn')?.addEventListener('click', () => {
    if (!state.selected) return;
    const idx = state.favorites.indexOf(state.selected.s);
    if (idx > -1) {
        state.favorites.splice(idx, 1);
        toast('Removed from favorites');
    } else {
        state.favorites.push(state.selected.s);
        toast('Added to favorites! ⭐');
    }
    localStorage.setItem('fav', JSON.stringify(state.favorites));
    document.getElementById('favDetailBtn').classList.toggle('active');
    updateFavList();
});

function updateFavList() {
    if (state.favorites.length === 0) {
        document.getElementById('favList').innerHTML = 'No favorites yet';
        return;
    }
    const html = state.favorites.map(s => {
        const el = ELEMENTS.find(e => e.s === s);
        return `
            <div class="fav-item" style="border-left-color:${el.c}" onclick='showElement(${JSON.stringify(el).replace(/'/g,"&apos;")})'>
                <span style="color:${el.c}">${el.s} - ${el.n}</span>
                <button class="fav-remove" onclick="event.stopPropagation();removeFav('${s}')">×</button>
            </div>
        `;
    }).join('');
    document.getElementById('favList').innerHTML = html;
}

function removeFav(s) {
    state.favorites = state.favorites.filter(f => f !== s);
    localStorage.setItem('fav', JSON.stringify(state.favorites));
    updateFavList();
}

// QUIZ
function openQuiz() {
    state.quiz = { score: 0, num: 0, time: 30, level: 'easy' };
    document.getElementById('quizModal').classList.add('active');
    nextQ();
}

function nextQ() {
    state.quiz.num++;
    if (state.quiz.num > 10) {
        toast(`Quiz Complete! Score: ${state.quiz.score}/10`);
        closeQuiz();
        return;
    }
    
    const correct = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const question = `What is the symbol for ${correct.n}?`;
    const options = [correct.s];
    
    while (options.length < 4) {
        const opt = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)].s;
        if (!options.includes(opt)) options.push(opt);
    }
    options.sort(() => Math.random() - 0.5);
    
    document.getElementById('quizQ').textContent = question;
    document.getElementById('quizOpts').innerHTML = options.map(opt => `
        <button onclick="checkAnswer('${opt}', '${correct.s}')">${opt}</button>
    `).join('');
    document.getElementById('qScore').textContent = state.quiz.score;
    document.getElementById('qNext').style.display = 'none';
    
    let timeLeft = state.quiz.level === 'easy' ? 30 : state.quiz.level === 'medium' ? 20 : 15;
    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('qTime').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            toast('Time up!');
            document.getElementById('qNext').style.display = 'block';
        }
    }, 1000);
}

function checkAnswer(selected, correct) {
    if (selected === correct) {
        state.quiz.score++;
        toast('Correct! ✓');
    } else {
        toast(`Wrong! Answer: ${correct}`);
    }
    document.getElementById('qNext').style.display = 'block';
}

function closeQuiz() {
    document.getElementById('quizModal').classList.remove('active');
}

// TRENDS
function openTrends() {
    document.getElementById('trendsModal').classList.add('active');
    showTrend('mass');
}

function showTrend(type) {
    const canvas = document.getElementById('trendCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 800, 400);
    
    const data = ELEMENTS.slice(0, 20);
    const barWidth = 800 / data.length;
    const maxVal = Math.max(...data.map(el => type === 'mass' ? el.m : el.r));
    
    data.forEach((el, i) => {
        const val = type === 'mass' ? el.m : el.r;
        const height = (val / maxVal) * 350;
        
        ctx.fillStyle = el.c;
        ctx.fillRect(i * barWidth + 5, 400 - height - 30, barWidth - 10, height);
        
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text');
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(el.s, i * barWidth + barWidth / 2, 390);
    });
}

function closeTrends() {
    document.getElementById('trendsModal').classList.remove('active');
}

// TIMELINE
function openTimeline() {
    document.getElementById('timelineModal').classList.add('active');
    const timeline = {
        'Ancient': ['Cu','Ag','Au','Fe','S','C'],
        '1669': ['P'],
        '1766': ['H'],
        '1774': ['O','Cl'],
        '1789': ['Zr','U'],
        '1807': ['Na','K'],
        '1811': ['I'],
        '1817': ['Li','Se'],
        '1860': ['Cs','Rb'],
        '1868': ['He'],
        '1898': ['Kr','Ne','Xe','Rn'],
        '1940': ['Np','Pu'],
        '2016': ['Nh','Mc','Ts','Og']
    };
    
    const html = Object.entries(timeline).map(([year, syms]) => `
        <div class="timeline-item">
            <div class="timeline-year">${year}</div>
            <div class="timeline-elements">
                ${syms.map(s => {
                    const el = ELEMENTS.find(e => e.s === s);
                    return el ? `
                        <div class="timeline-el" style="border-color:${el.c};color:${el.c}"
                             onclick='showElement(${JSON.stringify(el).replace(/'/g,"&apos;")})'>
                            ${s} - ${el.n}
                        </div>
                    ` : '';
                }).join('')}
            </div>
        </div>
    `).join('');
    document.getElementById('timeline').innerHTML = html;
}

function closeTimeline() {
    document.getElementById('timelineModal').classList.remove('active');
}

// THEME
document.getElementById('themeBtn')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('themeBtn').textContent = state.theme === 'dark' ? '🌙' : '☀️';
    if (state.selected) render3D(state.selected);
});

// SOUND
document.getElementById('soundBtn')?.addEventListener('click', () => {
    state.sound = !state.sound;
    document.getElementById('soundBtn').classList.toggle('active');
    toast(state.sound ? 'Sound ON' : 'Sound OFF');
});

// UTILS
function showRandom() {
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    showElement(el);
}

function closeDetail() {
    document.getElementById('detailModal').classList.remove('active');
    if (state.animId) cancelAnimationFrame(state.animId);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        toast('Fullscreen ON');
    } else {
        document.exitFullscreen();
        toast('Fullscreen OFF');
    }
}

function resetAll() {
    state.category = null;
    state.compare = [];
    document.getElementById('search').value = '';
    renderTable();
    renderCategories();
    toast('Reset complete!');
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// EVENT SETUP
function setupEvents() {
    document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => switchTab(t.dataset.tab));
    });
    
    document.querySelectorAll('.diff').forEach(d => {
        d.addEventListener('click', () => {
            document.querySelectorAll('.diff').forEach(b => b.classList.remove('active'));
            d.classList.add('active');
            state.quiz.level = d.dataset.level;
        });
    });
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeDetail();
            closeQuiz();
            closeCompare();
            closeTrends();
            closeTimeline();
        }
    });
}

console.log('🎉 Periodic Table LOADED - All 118 Elements + All Features!');
