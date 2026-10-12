/* Myth Buster — a small 3D arcade game.
   Claims fly out of an ancient data tunnel. Blast the myths, let the facts pass.
   Click / tap a claim, or press its number key (1–3). */
(function () {
    'use strict';

    const CYAN = 0x4de1ff, GREEN = 0x3dff8f, GOLD = 0xe7b75f, RED = 0xff4d5e;
    const SPAWN_Z = -30, ESCAPE_Z = 4.2, MAX_ON_SCREEN = 3, START_SHIELDS = 3;

    /* ---------- the claims ---------- */
    const CLAIMS = [
        { myth: true, shape: 'gear', text: 'Computers were invented in the 20th century.',
          truth: 'The Antikythera mechanism — Greek, roughly 2nd century BC — used bronze gears to predict eclipses. One gear has 223 teeth: one per lunar month of the Saros cycle.',
          source: 'Freeth et al., Nature (2006)' },
        { myth: true, shape: 'crystal', text: 'The word “bug” comes from a moth found in 1947.',
          truth: 'Engineers already said “bug” — Edison used it in 1878. The Harvard Mark II team taped the moth into their log as the “first actual case of bug being found”: the joke only works because the word existed.',
          source: 'Smithsonian National Museum of American History' },
        { myth: true, shape: 'globe', text: '“The cloud” lives somewhere up in the sky.',
          truth: 'The cloud is warehouse-sized data centres on the ground, and almost all intercontinental traffic runs through fibre-optic cables on the sea floor.',
          source: 'TeleGeography submarine cable map' },
        { myth: true, shape: 'chip', text: 'Moore’s law is a law of physics.',
          truth: 'It is an observation. In 1965 Gordon Moore saw transistor counts doubling yearly, revised in 1975 to every two years. The industry kept it alive as a roadmap.',
          source: 'G. Moore, Electronics (1965)' },
        { myth: true, shape: 'orb', text: 'Artificial intelligence is a 21st-century idea.',
          truth: 'The term was coined for the 1956 Dartmouth workshop, and Rosenblatt’s perceptron — an ancestor of today’s neural networks — appeared in 1958.',
          source: 'Dartmouth proposal (1955) · Rosenblatt (1958)' },
        { myth: true, shape: 'orb', text: 'A qubit is simply 0 and 1 at the same time.',
          truth: 'A qubit’s state is a point on the Bloch sphere, with continuous amplitudes and a phase. Measure it and you get a plain 0 or 1, with probabilities set by that state.',
          source: 'Nielsen & Chuang, Quantum Computation and Quantum Information' },
        { myth: true, shape: 'chip', text: 'Bill Gates said “640K ought to be enough for anybody.”',
          truth: 'There is no record of him saying it, and he has repeatedly denied it.',
          source: 'Quote Investigator' },
        { myth: true, shape: 'globe', text: 'The Internet and the World Wide Web are the same thing.',
          truth: 'The Internet is the global network — its ancestor ARPANET dates to 1969. The Web is one service running on it, invented by Tim Berners-Lee at CERN in 1989–91.',
          source: 'CERN — The birth of the Web' },
        { myth: true, shape: 'crystal', text: 'Fully drain your phone battery before charging it.',
          truth: 'That habit comes from old nickel-cadmium cells and their “memory effect”. Lithium-ion batteries prefer partial charges; deep discharges wear them faster.',
          source: 'Battery University' },
        { myth: true, shape: 'gear', text: 'The first computer program was written in the 1940s.',
          truth: 'In 1843 Ada Lovelace published an algorithm for Babbage’s Analytical Engine — Note G — widely called the first computer program.',
          source: 'Lovelace, Notes on the Analytical Engine (1843)' },

        { myth: false, shape: 'globe', text: 'ARPANET’s first message crashed after two letters.',
          truth: 'In October 1969 UCLA tried to send “LOGIN” to Stanford. The system crashed after “LO”.',
          source: 'UCLA · Leonard Kleinrock' },
        { myth: false, shape: 'crystal', text: 'Python is named after Monty Python, not the snake.',
          truth: 'Guido van Rossum was reading the scripts of Monty Python’s Flying Circus when he picked the name.',
          source: 'Python documentation — General FAQ' },
        { myth: false, shape: 'gear', text: 'Looms ran on punched cards by 1804.',
          truth: 'Joseph Marie Jacquard’s loom read chains of punched cards to weave patterns — an ancestor of programmable machines.',
          source: 'Science Museum, London' },
        { myth: false, shape: 'chip', text: 'Apollo’s guidance computer had 2,048 words of RAM.',
          truth: '2,048 words of erasable memory plus 36,864 words of fixed “rope” memory — enough to land on the Moon.',
          source: 'NASA · MIT Instrumentation Laboratory' },
        { myth: false, shape: 'globe', text: 'A copy of the very first website is still online.',
          truth: 'CERN restored the 1991 site, and it is live at info.cern.ch.',
          source: 'CERN' },
        { myth: false, shape: 'crystal', text: 'Linus Torvalds created Git in 2005.',
          truth: 'He wrote it after the Linux kernel lost free use of BitKeeper, and Git was managing its own code within days.',
          source: 'git-scm.com — A Short History of Git' }
    ];
    const MYTH_TOTAL = CLAIMS.filter((c) => c.myth).length;

    const RANKS = [
        { min: 16, title: 'Archmage of Antikythera', note: 'A flawless run. Not a single myth escaped you.' },
        { min: 13, title: 'Keeper of the Codex', note: 'Sharp eyes. The old engineers would hire you.' },
        { min: 9, title: 'Rune Apprentice', note: 'Good instincts — a few claims slipped past.' },
        { min: 0, title: 'Novice Scribe', note: 'The myths are tricky. Read the codex and try again.' }
    ];

    /* ---------- small helpers ---------- */
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const rand = (a, b) => a + Math.random() * (b - a);
    const shuffle = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    };
    const store = {
        get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    };

    /* ---------- sound (synthesised, no files) ---------- */
    function makeSfx() {
        let ctx = null, master = null, on = store.get('pkg-mg-sound') !== 'off';
        const ensure = () => {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                ctx = new AC();
                master = ctx.createGain();
                master.gain.value = 0.12;
                master.connect(ctx.destination);
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        };
        const tone = (type, f0, f1, dur, vol, delay) => {
            if (!on) return;
            const c = ensure();
            if (!c) return;
            const t0 = c.currentTime + (delay || 0);
            const o = c.createOscillator(), g = c.createGain();
            o.type = type;
            o.frequency.setValueAtTime(f0, t0);
            o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
            g.gain.setValueAtTime(vol, t0);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g);
            g.connect(master);
            o.start(t0);
            o.stop(t0 + dur + 0.02);
        };
        const noise = (dur, vol) => {
            if (!on) return;
            const c = ensure();
            if (!c) return;
            const len = Math.floor(c.sampleRate * dur);
            const buf = c.createBuffer(1, len, c.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
            const s = c.createBufferSource();
            s.buffer = buf;
            const f = c.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.setValueAtTime(3200, c.currentTime);
            f.frequency.exponentialRampToValueAtTime(180, c.currentTime + dur);
            const g = c.createGain();
            g.gain.value = vol;
            s.connect(f);
            f.connect(g);
            g.connect(master);
            s.start();
        };
        return {
            unlock: ensure,
            isOn: () => on,
            toggle: () => { on = !on; store.set('pkg-mg-sound', on ? 'on' : 'off'); if (on) ensure(); return on; },
            laser: () => tone('square', 1300, 200, 0.11, 0.25),
            boom: () => { noise(0.5, 0.9); tone('sine', 150, 40, 0.4, 0.6); },
            wrong: () => { tone('sawtooth', 240, 120, 0.3, 0.35); },
            spared: () => { tone('triangle', 660, 990, 0.12, 0.35); tone('triangle', 990, 1320, 0.14, 0.3, 0.1); },
            hurt: () => { tone('square', 180, 60, 0.4, 0.35); noise(0.3, 0.45); },
            combo: (n) => tone('sine', 520 + n * 140, 700 + n * 160, 0.12, 0.25),
            start: () => { tone('triangle', 440, 880, 0.14, 0.35); tone('triangle', 660, 1320, 0.2, 0.35, 0.12); },
            end: () => { tone('triangle', 880, 220, 0.7, 0.35); }
        };
    }

    /* ---------- claim label texture ---------- */
    function roundRect(g, x, y, w, h, r) {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }
    function wrapText(g, text, maxW) {
        const words = text.split(' ');
        const lines = [];
        let line = '';
        words.forEach((w) => {
            const test = line ? line + ' ' + w : w;
            if (g.measureText(test).width > maxW && line) {
                lines.push(line);
                line = w;
            } else line = test;
        });
        if (line) lines.push(line);
        return lines;
    }
    function labelTexture(text, key) {
        const W = 640, pad = 32, lh = 48;
        const c = document.createElement('canvas');
        const g = c.getContext('2d');
        const font = '600 38px "Space Grotesk", system-ui, sans-serif';
        g.font = font;
        const lines = wrapText(g, text, W - pad * 2);
        const H = pad * 2 + 46 + lines.length * lh;
        c.width = W;
        c.height = H;
        g.fillStyle = 'rgba(4, 12, 14, 0.88)';
        roundRect(g, 3, 3, W - 6, H - 6, 22);
        g.fill();
        g.strokeStyle = 'rgba(77, 225, 255, 0.85)';
        g.lineWidth = 3;
        g.stroke();
        g.strokeStyle = '#e7b75f';
        g.lineWidth = 5;
        [[3, 30, 3, 3, 30, 3], [W - 30, 3, W - 3, 3, W - 3, 30], [3, H - 30, 3, H - 3, 30, H - 3], [W - 30, H - 3, W - 3, H - 3, W - 3, H - 30]].forEach((p) => {
            g.beginPath();
            g.moveTo(p[0], p[1]);
            g.lineTo(p[2], p[3]);
            g.lineTo(p[4], p[5]);
            g.stroke();
        });
        g.font = '700 25px "JetBrains Mono", monospace';
        g.fillStyle = '#031009';
        roundRect(g, pad - 6, pad - 4, 50, 36, 6);
        g.fillStyle = '#e7b75f';
        g.fill();
        g.fillStyle = '#031009';
        g.fillText(String(key), pad + 11, pad + 23);
        g.fillStyle = '#7fa597';
        g.fillText('CLAIM · MYTH OR FACT?', pad + 60, pad + 23);
        g.font = font;
        g.fillStyle = '#eafff4';
        lines.forEach((l, i) => g.fillText(l, pad, pad + 46 + 36 + i * lh));
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        return { tex: tex, aspect: H / W };
    }

    /* ---------- target shapes (same look for myths and facts) ---------- */
    function gearGeometry(teeth, r, depth) {
        const p = (Math.PI * 2) / teeth, tip = r * 1.12, root = r * 0.92;
        const s = new THREE.Shape();
        for (let i = 0; i < teeth; i++) {
            const a = i * p;
            [[root, a - 0.3 * p], [tip, a - 0.14 * p], [tip, a + 0.14 * p], [root, a + 0.3 * p]].forEach((q, k) => {
                const x = Math.cos(q[1]) * q[0], y = Math.sin(q[1]) * q[0];
                if (i === 0 && k === 0) s.moveTo(x, y);
                else s.lineTo(x, y);
            });
        }
        const hole = new THREE.Path();
        hole.absarc(0, 0, r * 0.32, 0, Math.PI * 2, true);
        s.holes.push(hole);
        for (let w = 0; w < 4; w++) {
            const a0 = (w / 4) * Math.PI * 2 + 0.22, a1 = a0 + Math.PI / 2 - 0.44;
            const win = new THREE.Path();
            win.absarc(0, 0, r * 0.78, a0, a1, false);
            win.absarc(0, 0, r * 0.45, a1, a0, true);
            s.holes.push(win);
        }
        const geo = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false, curveSegments: 8 });
        geo.translate(0, 0, -depth / 2);
        return geo;
    }
    const GEOS = {};
    function geos() {
        if (GEOS.ready) return GEOS;
        GEOS.crystal = new THREE.OctahedronGeometry(0.62, 0);
        GEOS.crystal.scale(1, 1.55, 1);
        GEOS.crystalInner = new THREE.OctahedronGeometry(0.3, 0);
        GEOS.gear = gearGeometry(18, 0.78, 0.24);
        GEOS.hub = new THREE.CylinderGeometry(0.2, 0.2, 0.42, 16);
        GEOS.hub.rotateX(Math.PI / 2);
        GEOS.globe = new THREE.IcosahedronGeometry(0.72, 1);
        GEOS.ring = new THREE.TorusGeometry(1.05, 0.03, 6, 64);
        GEOS.chip = new THREE.BoxGeometry(1.25, 0.2, 1.25);
        GEOS.die = new THREE.BoxGeometry(0.62, 0.08, 0.62);
        GEOS.pin = new THREE.BoxGeometry(0.08, 0.06, 0.22);
        GEOS.orb = new THREE.IcosahedronGeometry(0.6, 0);
        GEOS.hit = new THREE.SphereGeometry(1.2, 10, 8);
        GEOS.ready = true;
        return GEOS;
    }
    function buildShape(kind, mat, edgeMat, accentMat) {
        const G = geos();
        const g = new THREE.Group();
        const add = (geo, m, withEdges) => {
            const mesh = new THREE.Mesh(geo, m || mat);
            g.add(mesh);
            if (withEdges !== false) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), edgeMat));
            return mesh;
        };
        if (kind === 'gear') {
            add(G.gear);
            add(G.hub, accentMat, false);
        } else if (kind === 'globe') {
            add(G.globe);
            const r1 = add(G.ring, accentMat, false);
            r1.rotation.x = 1.2;
            const r2 = add(G.ring, accentMat, false);
            r2.rotation.y = 1.1;
            r2.scale.setScalar(0.92);
        } else if (kind === 'chip') {
            const body = add(G.chip);
            body.rotation.x = 0.5;
            const die = add(G.die, accentMat, false);
            die.position.y = 0.13;
            body.add(die);
            for (let i = 0; i < 4; i++) {
                for (let side = 0; side < 4; side++) {
                    const pin = new THREE.Mesh(G.pin, accentMat);
                    const off = -0.42 + i * 0.28;
                    if (side === 0) pin.position.set(off, 0, 0.72);
                    if (side === 1) pin.position.set(off, 0, -0.72);
                    if (side === 2) { pin.position.set(0.72, 0, off); pin.rotation.y = Math.PI / 2; }
                    if (side === 3) { pin.position.set(-0.72, 0, off); pin.rotation.y = Math.PI / 2; }
                    body.add(pin);
                }
            }
        } else if (kind === 'orb') {
            add(G.orb);
            const r = add(G.ring, accentMat, false);
            r.rotation.x = Math.PI / 2.4;
        } else {
            add(G.crystal);
            add(G.crystalInner, accentMat, false);
        }
        return g;
    }

    /* =====================================================================
       Game
       ===================================================================== */
    window.initMythGame = function (root, codexList) {
        const sfx = makeSfx();
        let best = parseInt(store.get('pkg-mg-best') || '0', 10) || 0;

        /* ----- codex of truths (always available, also for no-WebGL) ----- */
        if (codexList) {
            const ordered = CLAIMS.filter((c) => c.myth).concat(CLAIMS.filter((c) => !c.myth));
            codexList.innerHTML = ordered.map((c) =>
                '<li class="' + (c.myth ? 'is-myth' : 'is-fact') + '"><span class="verdict">' + (c.myth ? 'MYTH' : 'FACT') + '</span>' +
                '<div><p class="claim">' + esc(c.text) + '</p><p class="truth">' + esc(c.truth) + '</p><small>Source · ' + esc(c.source) + '</small></div></li>'
            ).join('');
        }

        /* ----- DOM overlay ----- */
        root.innerHTML =
            '<div class="mg-canvas"></div>' +
            '<div class="mg-flash"></div>' +
            '<div class="mg-pops" aria-hidden="true"></div>' +
            '<div class="mg-hud" hidden>' +
            '  <div class="mg-stat"><span>SCORE</span><b data-k="score">0</b></div>' +
            '  <div class="mg-stat"><span>COMBO</span><b data-k="combo">×1</b></div>' +
            '  <div class="mg-stat"><span>MYTHS BUSTED</span><b data-k="busted">0/' + MYTH_TOTAL + '</b></div>' +
            '  <div class="mg-stat"><span>SHIELDS</span><b class="mg-shields" data-k="shields"></b></div>' +
            '  <div class="mg-tools"><button type="button" class="mini-btn" data-act="sound"></button><button type="button" class="mini-btn" data-act="pause">PAUSE</button></div>' +
            '  <div class="mg-progress"><i data-k="progress"></i></div>' +
            '</div>' +
            '<div class="mg-feed" aria-live="polite"></div>' +
            '<div class="mg-screen mg-start">' +
            '  <p class="kicker-sm">PKG//OS · ARCADE</p>' +
            '  <h3 class="mg-title glitch" data-text="MYTH BUSTER">MYTH BUSTER</h3>' +
            '  <p class="mg-lead">Claims about technology fly out of the tunnel. Decide fast: <b>myth</b> or <b>fact</b>?</p>' +
            '  <ul class="mg-rules">' +
            '    <li><i>◎</i><span>Click or tap a claim to blast it — or press its number key <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd>.</span></li>' +
            '    <li><i class="r">✕</i><span>Myths: blast them before they reach you.</span></li>' +
            '    <li><i class="g">✓</i><span>Facts are true — let them fly past.</span></li>' +
            '    <li><i class="y">◆</i><span>3 shields. You lose one for every escaped myth or blasted fact.</span></li>' +
            '  </ul>' +
            '  <div class="mg-actions"><button type="button" class="btn btn-primary" data-act="start"><span class="g">▶</span>Start game</button><span class="mg-best"></span></div>' +
            '</div>' +
            '<div class="mg-screen mg-pause" hidden><h3 class="mg-title">PAUSED</h3><button type="button" class="btn btn-primary" data-act="resume"><span class="g">▶</span>Resume</button></div>' +
            '<div class="mg-screen mg-over" hidden>' +
            '  <p class="kicker-sm mg-over-kicker">RUN COMPLETE</p>' +
            '  <h3 class="mg-title mg-rank"></h3>' +
            '  <p class="mg-lead mg-rank-note"></p>' +
            '  <div class="mg-stats"></div>' +
            '  <div class="mg-actions"><button type="button" class="btn btn-primary" data-act="start"><span class="g">↻</span>Play again</button><button type="button" class="btn btn-ghost" data-act="codex"><span class="g rune">ᚱ</span>Read every truth</button></div>' +
            '</div>';
        const $ = (sel) => root.querySelector(sel);
        const hud = $('.mg-hud'), feed = $('.mg-feed'), pops = $('.mg-pops'), flash = $('.mg-flash');
        const scrStart = $('.mg-start'), scrPause = $('.mg-pause'), scrOver = $('.mg-over');
        const hk = {};
        root.querySelectorAll('[data-k]').forEach((el) => { hk[el.dataset.k] = el; });
        const soundBtn = $('[data-act="sound"]');
        const setSoundLabel = () => { soundBtn.textContent = sfx.isOn() ? 'SOUND · ON' : 'SOUND · OFF'; soundBtn.setAttribute('aria-pressed', String(sfx.isOn())); };
        setSoundLabel();
        const showBest = () => { $('.mg-best').textContent = best ? 'best score · ' + best : ''; };
        showBest();

        const api = { start: () => {} };
        if (!window.X3 || !X3.ok) {
            root.classList.add('no-webgl');
            scrStart.innerHTML = '<h3 class="mg-title">MYTH BUSTER</h3><p class="mg-lead">This game needs WebGL, which isn’t available here. Every myth and fact is listed below.</p>';
            if (codexList && codexList.parentElement) codexList.parentElement.open = true;
            return api;
        }

        /* ----- three.js scene ----- */
        const wrap = $('.mg-canvas');
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(X3.dpr());
        renderer.setClearColor(0x000000, 0);
        wrap.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x05080b, 20, 62);
        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
        const CAM = new THREE.Vector3(0, 1.1, 8.5);
        camera.position.copy(CAM);

        scene.add(new THREE.AmbientLight(0x8fa8a0, 0.7));
        const key = new THREE.DirectionalLight(0xfff0d0, 1.2);
        key.position.set(4, 6, 8);
        scene.add(key);
        const rim = new THREE.PointLight(CYAN, 1.4, 40);
        rim.position.set(-6, 3, 2);
        scene.add(rim);
        const under = new THREE.PointLight(GREEN, 0.9, 30);
        under.position.set(0, -3, 0);
        scene.add(under);

        /* tunnel of astrolabe gates */
        const gates = [];
        for (let i = 0; i < 9; i++) {
            const gate = new THREE.Group();
            const col = i % 2 ? GOLD : GREEN;
            gate.add(new THREE.Mesh(new THREE.TorusGeometry(7.4, 0.035, 6, 120), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 })));
            const tk = [];
            for (let k = 0; k < 48; k++) {
                const a = (k / 48) * Math.PI * 2, l = k % 4 === 0 ? 0.5 : 0.2;
                tk.push(Math.cos(a) * 7.4, Math.sin(a) * 7.4, 0, Math.cos(a) * (7.4 - l), Math.sin(a) * (7.4 - l), 0);
            }
            const tg = new THREE.BufferGeometry();
            tg.setAttribute('position', new THREE.Float32BufferAttribute(tk, 3));
            gate.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.45 })));
            gate.position.set(0, 1.4, -i * 6);
            gate.userData.spin = (i % 2 ? 1 : -1) * 0.08;
            gates.push(gate);
            scene.add(gate);
        }
        const addRunes = () => {
            const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
            gates.forEach((gate, gi) => {
                for (let k = 0; k < 6; k++) {
                    const a = (k / 6) * Math.PI * 2 + gi;
                    const sp = X3.textSprite(runes[(gi * 6 + k) % runes.length], { color: '#e7b75f', size: 64, font: '"Noto Sans Runic", "Segoe UI Historic", sans-serif', weight: 400, height: 0.55, pad: 6 });
                    sp.material.opacity = 0.7;
                    sp.position.set(Math.cos(a) * 6.7, Math.sin(a) * 6.7, 0);
                    gate.add(sp);
                }
            });
        };
        if (document.fonts && document.fonts.load) {
            Promise.race([document.fonts.load('64px "Noto Sans Runic"', 'ᚠ'), new Promise((r) => setTimeout(r, 2500))]).then(addRunes, addRunes);
        } else addRunes();

        const floor = new THREE.GridHelper(60, 30, 0x1f6b44, 0x0f3322);
        floor.material.transparent = true;
        floor.material.opacity = 0.55;
        floor.position.y = -2.4;
        scene.add(floor);

        /* warp streaks */
        const STAR_N = X3.small() ? 260 : 520;
        const starPos = new Float32Array(STAR_N * 3);
        for (let i = 0; i < STAR_N; i++) {
            const a = Math.random() * Math.PI * 2, r = 8.5 + Math.random() * 12;
            starPos[i * 3] = Math.cos(a) * r;
            starPos[i * 3 + 1] = Math.sin(a) * r + 1.4;
            starPos[i * 3 + 2] = rand(-48, 8);
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: CYAN, size: 0.12, map: X3.glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        scene.add(stars);

        /* the "astrolabe cannon" */
        const cannon = new THREE.Group();
        cannon.position.set(0, -1.15, 6.4);
        const cannonBase = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.8, roughness: 0.3, emissive: 0x3a2808 }));
        cannonBase.rotation.x = Math.PI / 2;
        cannon.add(cannonBase);
        const barrel = new THREE.Group();
        const barrelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 1.1, 14), new THREE.MeshStandardMaterial({ color: 0x15302a, metalness: 0.7, roughness: 0.35, emissive: 0x0a3a24 }));
        barrelMesh.rotation.x = Math.PI / 2;
        barrelMesh.position.z = -0.5;
        barrel.add(barrelMesh);
        const barrelRing = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 24), new THREE.MeshBasicMaterial({ color: GREEN }));
        barrelRing.position.z = -1.05;
        barrel.add(barrelRing);
        const muzzle = X3.glow(GREEN, 0.01, 0.95);
        muzzle.position.z = -1.12;
        barrel.add(muzzle);
        cannon.add(barrel);
        scene.add(cannon);

        /* reticle that locks on the hovered claim */
        const reticle = new THREE.Group();
        reticle.add(new THREE.Mesh(new THREE.RingGeometry(1.32, 1.4, 48), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false })));
        for (let k = 0; k < 4; k++) {
            const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.4), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false }));
            const a = (k / 4) * Math.PI * 2;
            tick.position.set(Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0);
            tick.rotation.z = a + Math.PI / 2;
            reticle.add(tick);
        }
        reticle.visible = false;
        reticle.renderOrder = 10;
        scene.add(reticle);

        /* shared materials */
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x14353a, emissive: 0x0b4a46, emissiveIntensity: 0.9, metalness: 0.65, roughness: 0.3, flatShading: true, transparent: true });
        const edgeMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.9 });
        const accentMat = new THREE.MeshStandardMaterial({ color: GOLD, emissive: 0x4a3410, metalness: 0.85, roughness: 0.3, transparent: true });
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });

        /* ----- particles: shards ----- */
        const SHARDS = 420;
        const shardMesh = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.13), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }), SHARDS);
        shardMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        const shards = [];
        const dummy = new THREE.Object3D();
        const tmpCol = new THREE.Color();
        for (let i = 0; i < SHARDS; i++) {
            shards.push({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3(), s: 1 });
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            shardMesh.setMatrixAt(i, dummy.matrix);
            shardMesh.setColorAt(i, tmpCol.setHex(CYAN));
        }
        shardMesh.frustumCulled = false;
        scene.add(shardMesh);
        let shardCursor = 0;
        const burst = (pos, colors, n, power) => {
            for (let k = 0; k < n; k++) {
                const i = shardCursor;
                shardCursor = (shardCursor + 1) % SHARDS;
                const s = shards[i];
                s.life = s.max = rand(0.8, 1.6);
                s.p.copy(pos);
                s.v.set(rand(-1, 1), rand(-0.6, 1.2), rand(-1, 1)).normalize().multiplyScalar(rand(2, power || 7));
                s.r.set(rand(0, 6), rand(0, 6), rand(0, 6));
                s.rv.set(rand(-8, 8), rand(-8, 8), rand(-8, 8));
                s.s = rand(0.6, 1.6);
                shardMesh.setColorAt(i, tmpCol.setHex(colors[k % colors.length]));
            }
            if (shardMesh.instanceColor) shardMesh.instanceColor.needsUpdate = true;
        };

        /* shockwave rings + flashes */
        const waves = [];
        const wave = (pos, color, size) => {
            const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
            m.position.copy(pos);
            m.lookAt(camera.position);
            scene.add(m);
            const g = X3.glow(color, 1, 1);
            g.position.copy(pos);
            scene.add(g);
            waves.push({ m: m, g: g, t: 0, size: size || 4 });
        };

        /* laser beams */
        const beamGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 8, 1, true);
        beamGeo.translate(0, 0.5, 0);
        beamGeo.rotateX(Math.PI / 2);
        const beams = [];
        const muzzleWorld = new THREE.Vector3();
        const fireBeam = (to, color) => {
            muzzle.getWorldPosition(muzzleWorld);
            const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
            m.position.copy(muzzleWorld);
            m.lookAt(to);
            m.scale.set(1, 1, muzzleWorld.distanceTo(to));
            const core = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
            core.scale.set(0.35, 0.35, 1);
            m.add(core);
            scene.add(m);
            beams.push({ m: m, t: 0 });
            muzzleFlash = 1;
            recoil = 1;
        };
        let muzzleFlash = 0, recoil = 0;

        /* ----- game state ----- */
        let state = 'intro';
        let targets = [];
        let queue = [];
        let qi = 0;
        let spawnTimer = 0;
        let score = 0, combo = 1, shields = START_SHIELDS, busted = 0, spared = 0, factsHit = 0, escaped = 0, shots = 0, hits = 0;
        let shake = 0;
        const pointer = { x: 0, y: 0, inside: false, type: 'mouse' };
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        let hovered = null;

        const laneX = () => (camera.aspect < 0.9 ? [-1.9, 0, 1.9] : [-3.6, 0, 3.6]);
        const laneY = [1.9, 0.2, 1.1];
        const labelW = () => (camera.aspect < 0.9 ? 2.9 : 3.4);
        const freeSlot = () => {
            for (let s = 1; s <= MAX_ON_SCREEN; s++) if (!targets.some((t) => t.slot === s && t.state === 'fly')) return s;
            return 0;
        };
        const flying = () => targets.filter((t) => t.state === 'fly');

        function spawn() {
            const slot = freeSlot();
            if (!slot) return false;
            const def = queue[qi++];
            const t = { def: def, slot: slot, state: 'fly', age: 0, fade: 1 };
            t.mat = baseMat.clone();
            t.edge = edgeMat.clone();
            t.accent = accentMat.clone();
            t.group = new THREE.Group();
            t.body = buildShape(def.shape, t.mat, t.edge, t.accent);
            t.group.add(t.body);
            t.glow = X3.glow(CYAN, 2.8, 0.3);
            t.group.add(t.glow);
            const lt = labelTexture(def.text, slot);
            const lw = labelW();
            t.label = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt.tex, transparent: true, depthWrite: false, fog: false }));
            t.label.scale.set(lw, lw * lt.aspect, 1);
            t.label.position.y = 1.25 + (lw * lt.aspect) / 2;
            t.label.userData.target = t;
            t.labelBase = t.label.scale.clone();
            t.group.add(t.label);
            t.hit = new THREE.Mesh(geos().hit, hitMat);
            t.hit.userData.target = t;
            t.group.add(t.hit);
            const lx = laneX()[slot - 1];
            t.group.position.set(lx + rand(-0.5, 0.5), laneY[slot - 1] + rand(-0.3, 0.3), SPAWN_Z);
            t.baseY = t.group.position.y;
            t.speed = 3.1 + Math.min(2.4, (qi - 1) * 0.16);
            t.spin = new THREE.Vector3(rand(-0.6, 0.6), rand(0.4, 1.1) * (Math.random() < 0.5 ? -1 : 1), rand(-0.3, 0.3));
            t.phase = rand(0, 6);
            scene.add(t.group);
            targets.push(t);
            return true;
        }

        function removeTarget(t) {
            scene.remove(t.group);
            t.label.material.map.dispose();
            t.label.material.dispose();
            t.mat.dispose();
            t.edge.dispose();
            t.accent.dispose();
            targets = targets.filter((x) => x !== t);
            if (hovered === t) hovered = null;
        }

        /* ----- DOM feedback ----- */
        const project = (pos) => {
            const v = pos.clone().project(camera);
            return { x: (v.x * 0.5 + 0.5) * root.clientWidth, y: (-v.y * 0.5 + 0.5) * root.clientHeight };
        };
        const pop = (pos, big, small, cls) => {
            const p = project(pos);
            const el = document.createElement('div');
            el.className = 'mg-pop ' + (cls || '');
            el.innerHTML = '<b>' + esc(big) + '</b>' + (small ? '<small>' + esc(small) + '</small>' : '');
            el.style.left = Math.max(60, Math.min(root.clientWidth - 60, p.x)) + 'px';
            el.style.top = Math.max(70, Math.min(root.clientHeight - 40, p.y)) + 'px';
            pops.appendChild(el);
            setTimeout(() => el.remove(), 1300);
        };
        const doFlash = (cls) => {
            flash.className = 'mg-flash ' + cls;
            void flash.offsetWidth;
            flash.classList.add('on');
        };
        let feedTimer = null;
        const showFeed = (kind, def) => {
            const tags = {
                busted: ['MYTH BUSTED', 'ok'], fact: ['THAT ONE IS TRUE', 'bad'],
                escaped: ['A MYTH GOT THROUGH', 'bad'], spared: ['FACT SPARED', 'ok']
            };
            const tg = tags[kind];
            feed.innerHTML = '<div class="mg-card ' + tg[1] + '"><span class="tag">' + tg[0] + '</span>' +
                '<p class="claim">' + esc(def.text) + '</p><p class="truth">' + esc(def.truth) + '</p><small>Source · ' + esc(def.source) + '</small></div>';
            feed.classList.add('show');
            clearTimeout(feedTimer);
            feedTimer = setTimeout(() => feed.classList.remove('show'), kind === 'spared' ? 4500 : 7500);
        };
        feed.addEventListener('click', () => feed.classList.remove('show'));

        const renderHud = () => {
            hk.score.textContent = String(score);
            hk.combo.textContent = '×' + combo;
            hk.combo.parentElement.classList.toggle('hot', combo >= 3);
            hk.busted.textContent = busted + '/' + MYTH_TOTAL;
            hk.shields.innerHTML = Array.from({ length: START_SHIELDS }, (_, i) => '<i class="' + (i < shields ? 'on' : '') + '">◆</i>').join('');
            const done = busted + spared + factsHit + escaped;
            hk.progress.style.width = (queue.length ? (done / queue.length) * 100 : 0) + '%';
        };

        /* ----- outcomes ----- */
        const shakeIt = (amt) => { if (!X3.reduced) shake = Math.max(shake, amt); };
        function bust(t, point) {
            const bonus = Math.round(60 * Math.max(0, Math.min(1, (ESCAPE_Z - t.group.position.z) / (ESCAPE_Z - SPAWN_Z))));
            const gain = (100 + bonus) * combo;
            score += gain;
            busted++;
            hits++;
            const pos = t.group.position.clone();
            burst(pos, [CYAN, GOLD, GREEN, 0xffffff], X3.small() ? 34 : 56, 8);
            wave(pos, GREEN, 5);
            pop(pos, '+' + gain, combo > 1 ? 'MYTH BUSTED · COMBO ×' + combo : 'MYTH BUSTED', 'ok');
            combo = Math.min(5, combo + 1);
            sfx.boom();
            if (combo > 2) sfx.combo(combo);
            shakeIt(0.35);
            showFeed('busted', t.def);
            removeTarget(t);
            void point;
        }
        function hitFact(t) {
            shields--;
            factsHit++;
            combo = 1;
            t.state = 'saved';
            t.fade = 1;
            const pos = t.group.position.clone();
            wave(pos, GOLD, 3);
            burst(pos, [GOLD], 14, 3);
            pop(pos, '−1 ◆', 'IT’S A FACT', 'bad');
            doFlash('red');
            sfx.wrong();
            shakeIt(0.25);
            showFeed('fact', t.def);
        }
        function escapeTarget(t) {
            if (t.def.myth) {
                shields--;
                escaped++;
                combo = 1;
                doFlash('red');
                sfx.hurt();
                shakeIt(0.45);
                showFeed('escaped', t.def);
                pop(t.group.position.clone().setZ(0), '−1 ◆', 'MYTH ESCAPED', 'bad');
            } else {
                spared++;
                score += 50;
                sfx.spared();
                doFlash('green');
                showFeed('spared', t.def);
                pop(t.group.position.clone().setZ(0), '+50', 'FACT SPARED', 'ok');
            }
            removeTarget(t);
        }
        function checkEnd() {
            if (state !== 'playing') return;
            if (shields <= 0) endGame(false);
            else if (qi >= queue.length && flying().length === 0) endGame(true);
        }

        /* ----- shooting ----- */
        const aimPoint = new THREE.Vector3(0, 1, -20);
        function pick(nx, ny) {
            ndc.set(nx, ny);
            ray.setFromCamera(ndc, camera);
            const list = [];
            flying().forEach((t) => { list.push(t.hit, t.label); });
            const hit = list.length ? ray.intersectObjects(list, false)[0] : null;
            return { target: hit ? hit.object.userData.target : null, point: hit ? hit.point : ray.ray.at(30, new THREE.Vector3()) };
        }
        function shootAt(target, point) {
            if (state !== 'playing') return;
            shots++;
            sfx.laser();
            const to = target ? target.group.position.clone() : point;
            fireBeam(to, target ? (target.def.myth ? GREEN : GOLD) : CYAN);
            if (!target) {
                combo = 1;
                burst(point, [CYAN], 6, 2);
                renderHud();
                return;
            }
            if (target.def.myth) bust(target, point);
            else hitFact(target);
            renderHud();
            checkEnd();
        }
        function shootSlot(slot) {
            const t = flying().find((x) => x.slot === slot);
            if (t) shootAt(t, t.group.position.clone());
            else if (state === 'playing') {
                shots++;
                combo = 1;
                sfx.laser();
                fireBeam(new THREE.Vector3(laneX()[slot - 1], laneY[slot - 1], -20), CYAN);
                renderHud();
            }
        }

        const canvasEl = renderer.domElement;
        const localNdc = (e) => {
            const r = canvasEl.getBoundingClientRect();
            return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
        };
        let down = null;
        canvasEl.addEventListener('pointermove', (e) => {
            const p = localNdc(e);
            pointer.x = p.x;
            pointer.y = p.y;
            pointer.inside = true;
            pointer.type = e.pointerType;
        });
        canvasEl.addEventListener('pointerleave', () => { pointer.inside = false; });
        canvasEl.addEventListener('pointerdown', (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            pointer.type = e.pointerType;
            const p = localNdc(e);
            if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
                if (state !== 'playing') return;
                const r = pick(p.x, p.y);
                shootAt(r.target, r.point);
            } else {
                down = { x: e.clientX, y: e.clientY, t: performance.now() };
            }
        });
        canvasEl.addEventListener('pointerup', (e) => {
            if (!down || e.pointerType === 'mouse') return;
            const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
            const quick = performance.now() - down.t < 450;
            down = null;
            if (moved > 12 || !quick || state !== 'playing') return;
            const p = localNdc(e);
            pointer.x = p.x;
            pointer.y = p.y;
            const r = pick(p.x, p.y);
            shootAt(r.target, r.point);
        });
        canvasEl.addEventListener('pointercancel', () => { down = null; });

        /* keyboard: 1–3 fire at that slot, P pauses */
        let inView = false;
        window.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
            if (!inView) return;
            if (state === 'playing' && (e.key === '1' || e.key === '2' || e.key === '3')) {
                e.preventDefault();
                shootSlot(parseInt(e.key, 10));
            } else if (e.key === 'p' || e.key === 'P') {
                if (state === 'playing') pause();
                else if (state === 'paused') resume();
            }
        });

        /* ----- flow ----- */
        function clearField() {
            targets.slice().forEach(removeTarget);
            targets = [];
        }
        function startGame() {
            sfx.unlock();
            clearField();
            const myths = shuffle(CLAIMS.filter((c) => c.myth));
            const facts = shuffle(CLAIMS.filter((c) => !c.myth));
            queue = myths.slice(0, 2).concat(shuffle(myths.slice(2).concat(facts)));
            qi = 0;
            score = 0; combo = 1; shields = START_SHIELDS; busted = 0; spared = 0; factsHit = 0; escaped = 0; shots = 0; hits = 0;
            spawnTimer = 0.7;
            state = 'playing';
            scrStart.hidden = true;
            scrOver.hidden = true;
            scrPause.hidden = true;
            hud.hidden = false;
            root.classList.add('is-playing');
            feed.classList.remove('show');
            renderHud();
            sfx.start();
        }
        function pause() {
            if (state !== 'playing') return;
            state = 'paused';
            scrPause.hidden = false;
        }
        function resume() {
            if (state !== 'paused') return;
            state = 'playing';
            scrPause.hidden = true;
            last = performance.now();
        }
        function endGame(survived) {
            state = 'over';
            root.classList.remove('is-playing');
            const correct = busted + spared;
            const rank = RANKS.find((r) => correct >= r.min) || RANKS[RANKS.length - 1];
            const isBest = score > best;
            if (isBest) {
                best = score;
                store.set('pkg-mg-best', String(best));
            }
            $('.mg-over-kicker').textContent = survived ? 'RUN COMPLETE' : 'SHIELDS DOWN';
            $('.mg-rank').textContent = rank.title;
            $('.mg-rank-note').textContent = rank.note;
            const acc = shots ? Math.round((hits / shots) * 100) : 0;
            $('.mg-stats').innerHTML = [
                ['SCORE', score + (isBest ? ' ★' : '')], ['MYTHS BUSTED', busted + '/' + MYTH_TOTAL],
                ['FACTS SPARED', spared + '/' + (CLAIMS.length - MYTH_TOTAL)], ['ACCURACY', acc + '%'], ['BEST', String(best)]
            ].map((s) => '<div><span>' + s[0] + '</span><b>' + s[1] + '</b></div>').join('');
            scrOver.hidden = false;
            hud.hidden = true;
            clearTimeout(feedTimer);
            feed.classList.remove('show');
            showBest();
            sfx.end();
            targets.forEach((t) => { if (t.state === 'fly') { t.state = 'saved'; t.fade = 1; } });
        }
        root.addEventListener('click', (e) => {
            const b = e.target.closest('[data-act]');
            if (!b) return;
            const act = b.dataset.act;
            if (act === 'start') startGame();
            else if (act === 'resume') resume();
            else if (act === 'pause') pause();
            else if (act === 'sound') { sfx.toggle(); setSoundLabel(); }
            else if (act === 'codex' && codexList) {
                const d = codexList.closest('details');
                if (d) {
                    d.open = true;
                    d.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
        scrPause.addEventListener('click', (e) => { if (e.target === scrPause) resume(); });

        /* pause when scrolled away or tab hidden */
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                entries.forEach((en) => {
                    inView = en.isIntersecting;
                    if (!inView) pause();
                });
            }, { threshold: 0.35 }).observe(root);
        } else inView = true;
        document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
        const vis = X3.watch(root);

        /* ----- layout ----- */
        const layout = () => {
            const w = wrap.clientWidth, h = wrap.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.fov = camera.aspect < 0.9 ? 68 : 55;
            camera.updateProjectionMatrix();
        };
        layout();
        if ('ResizeObserver' in window) new ResizeObserver(layout).observe(wrap);
        else window.addEventListener('resize', layout);

        /* ----- loop ----- */
        let last = performance.now();
        const camTarget = new THREE.Vector3();
        const tmp = new THREE.Vector3();
        function loop(now) {
            requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!vis.visible || document.hidden) return;
            const t = now / 1000;
            const playing = state === 'playing';
            const flow = (playing ? 1 : state === 'paused' ? 0 : 0.35) * (X3.reduced ? 0.5 : 1);

            /* environment */
            gates.forEach((g) => {
                g.position.z += dt * 2.6 * flow;
                if (g.position.z > 9) g.position.z -= 54;
                g.rotation.z += g.userData.spin * dt * (flow || 0.2);
            });
            floor.position.z = (floor.position.z + dt * 2.6 * flow) % 2;
            const sp = starGeo.attributes.position.array;
            for (let i = 0; i < STAR_N; i++) {
                sp[i * 3 + 2] += dt * 16 * flow;
                if (sp[i * 3 + 2] > 9) sp[i * 3 + 2] -= 57;
            }
            starGeo.attributes.position.needsUpdate = true;

            /* spawning + targets */
            if (playing) {
                spawnTimer -= dt;
                if (spawnTimer <= 0 && qi < queue.length) {
                    if (spawn()) spawnTimer = Math.max(2.5, 4.4 - qi * 0.13);
                    else spawnTimer = 0.4;
                }
            }
            targets.slice().forEach((tg) => {
                tg.age += dt;
                if (tg.state === 'fly') {
                    if (playing) tg.group.position.z += tg.speed * dt;
                    tg.group.position.y = tg.baseY + Math.sin(t * 1.4 + tg.phase) * 0.18;
                    tg.body.rotation.x += tg.spin.x * dt;
                    tg.body.rotation.y += tg.spin.y * dt;
                    tg.body.rotation.z += tg.spin.z * dt;
                    const appear = Math.min(1, tg.age / 0.6);
                    tg.group.scale.setScalar(0.4 + 0.6 * appear);
                    if (playing && tg.group.position.z > ESCAPE_Z) {
                        escapeTarget(tg);
                        renderHud();
                        checkEnd();
                    }
                } else if (tg.state === 'saved') {
                    tg.fade -= dt * 1.4;
                    tg.group.position.y += dt * 3;
                    tg.body.rotation.y += dt * 4;
                    const f = Math.max(0, tg.fade);
                    tg.mat.opacity = f;
                    tg.accent.opacity = f;
                    tg.edge.opacity = f * 0.9;
                    tg.label.material.opacity = f;
                    tg.glow.material.opacity = 0.3 * f;
                    tg.mat.emissive.setHex(0x5a4a10);
                    if (tg.fade <= 0) {
                        removeTarget(tg);
                        if (playing) checkEnd();
                    }
                }
            });

            /* hover lock-on */
            hovered = null;
            if (playing && pointer.inside && pointer.type === 'mouse') hovered = pick(pointer.x, pointer.y).target;
            targets.forEach((tg) => {
                const dist = camera.position.distanceTo(tg.group.position);
                const far = Math.min(2.4, Math.max(1, dist / 11)) / tg.group.scale.x;
                const k = (tg === hovered ? 1.07 : 1) * far;
                tg.label.scale.set(tg.labelBase.x * k, tg.labelBase.y * k, 1);
                tg.label.position.y = 1.25 + (tg.labelBase.y * k) / 2;
                tg.edge.color.setHex(tg === hovered ? GREEN : CYAN);
            });
            if (hovered) {
                reticle.visible = true;
                reticle.position.copy(hovered.group.position);
                reticle.quaternion.copy(camera.quaternion);
                reticle.rotateZ(t * 1.5);
                reticle.scale.setScalar(1 + Math.sin(t * 8) * 0.04);
            } else reticle.visible = false;

            /* cannon aim + recoil */
            if (hovered) aimPoint.copy(hovered.group.position);
            else if (pointer.inside) {
                ndc.set(pointer.x, pointer.y);
                ray.setFromCamera(ndc, camera);
                ray.ray.at(26, aimPoint);
            } else aimPoint.lerp(tmp.set(0, 1, -20), dt * 2);
            barrel.lookAt(aimPoint);
            recoil = Math.max(0, recoil - dt * 6);
            barrel.position.z = recoil * 0.18;
            muzzleFlash = Math.max(0, muzzleFlash - dt * 7);
            muzzle.scale.setScalar(0.01 + muzzleFlash * 1.4);
            cannonBase.rotation.z += dt * 0.8;

            /* beams */
            beams.slice().forEach((b) => {
                b.t += dt;
                const f = Math.max(0, 1 - b.t / 0.18);
                b.m.material.opacity = f;
                b.m.children[0].material.opacity = f;
                b.m.scale.x = b.m.scale.y = 0.6 + f * 0.6;
                if (b.t > 0.18) {
                    scene.remove(b.m);
                    b.m.material.dispose();
                    b.m.children[0].material.dispose();
                    beams.splice(beams.indexOf(b), 1);
                }
            });

            /* shockwaves */
            waves.slice().forEach((w) => {
                w.t += dt;
                const p = Math.min(1, w.t / 0.55);
                const e = 1 - Math.pow(1 - p, 3);
                w.m.scale.setScalar(0.3 + e * w.size);
                w.m.material.opacity = 0.9 * (1 - p);
                w.g.scale.setScalar(1 + e * w.size * 1.4);
                w.g.material.opacity = 1 - p;
                if (p >= 1) {
                    scene.remove(w.m, w.g);
                    w.m.geometry.dispose();
                    w.m.material.dispose();
                    w.g.material.dispose();
                    waves.splice(waves.indexOf(w), 1);
                }
            });

            /* shards */
            let anyShard = false;
            for (let i = 0; i < SHARDS; i++) {
                const s = shards[i];
                if (s.life <= 0) continue;
                anyShard = true;
                s.life -= dt;
                s.v.y -= 7 * dt;
                s.v.multiplyScalar(1 - dt * 0.8);
                s.p.addScaledVector(s.v, dt);
                s.r.x += s.rv.x * dt;
                s.r.y += s.rv.y * dt;
                s.r.z += s.rv.z * dt;
                dummy.position.copy(s.p);
                dummy.rotation.copy(s.r);
                dummy.scale.setScalar(Math.max(0, s.life / s.max) * s.s);
                dummy.updateMatrix();
                shardMesh.setMatrixAt(i, dummy.matrix);
            }
            if (anyShard) shardMesh.instanceMatrix.needsUpdate = true;

            /* camera: gentle parallax + shake */
            shake = Math.max(0, shake - dt * 1.6);
            const px = pointer.inside ? pointer.x : 0, py = pointer.inside ? pointer.y : 0;
            camera.position.set(
                CAM.x + px * 0.45 + (Math.random() - 0.5) * shake,
                CAM.y + py * 0.25 + (Math.random() - 0.5) * shake,
                CAM.z
            );
            camTarget.set(px * 1.2, 0.9 + py * 0.6, -20);
            camera.lookAt(camTarget);

            renderer.render(scene, camera);
        }
        requestAnimationFrame(loop);

        api.start = () => {
            root.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { if (state !== 'playing') startGame(); }, 650);
        };
        return api;
    };
})();
