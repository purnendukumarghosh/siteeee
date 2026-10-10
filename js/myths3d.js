/* Myth Lab: six small interactive 3D scenes sharing one WebGL renderer.
   Each scene is rendered offscreen and copied into its card's 2D canvas,
   so cards stay normal DOM elements (no z-index tricks, CSS works as usual). */
(function () {
    'use strict';

    const GREEN = 0x3dff8f, GOLD = 0xe7b75f, CYAN = 0x4de1ff, RED = 0xff4d5e, VIOLET = 0xa78bfa;

    const MYTHS = [
        {
            era: 'ANTIQUITY',
            claim: 'Computers are a 20th-century invention.',
            truth: [
                'The Antikythera mechanism — a Greek hand-cranked bronze device from roughly the 2nd century BC, found in a shipwreck in 1901 — computed eclipses and the positions of the Sun and Moon with interlocking gears.',
                'About 30 of its gears survive. One has 223 teeth: the number of lunar months in the Saros eclipse cycle.'
            ],
            source: 'Freeth et al., Nature (2006) · National Archaeological Museum, Athens',
            hint: 'drag ⟷ to crank',
            build: buildGears
        },
        {
            era: '1947',
            claim: 'The word “bug” was born when a moth got stuck in a computer.',
            truth: [
                'Engineers already called faults “bugs” — Thomas Edison used the word in an 1878 letter. In 1947 the Harvard Mark II team found a moth in relay #70 and taped it into the logbook as the “First actual case of bug being found.”',
                'The joke only works because the word already existed.'
            ],
            source: 'Logbook held by the Smithsonian National Museum of American History',
            hint: 'the moth follows your cursor',
            build: buildBug
        },
        {
            era: 'NOW',
            claim: '“The cloud” lives somewhere up in the sky.',
            truth: [
                'The cloud is other people’s computers: warehouse-sized data centres on the ground.',
                'Between continents, almost all internet traffic travels through fibre-optic cables lying on the sea floor — not through satellites.'
            ],
            source: 'TeleGeography submarine cable map',
            hint: 'drag to spin the globe',
            build: buildCables
        },
        {
            era: '1965 →',
            claim: 'Moore’s law is a law of physics.',
            truth: [
                'It is an observation. In 1965 Gordon Moore noted that transistor counts were doubling about every year; in 1975 he revised it to roughly every two years.',
                'It held for decades because the industry treated it as a target — an economic and engineering roadmap, not a law of nature.'
            ],
            source: 'G. Moore, “Cramming more components onto integrated circuits”, Electronics (1965)',
            hint: 'hover a bar · log scale',
            build: buildMoore
        },
        {
            era: '1956',
            claim: 'Artificial intelligence is a brand-new idea.',
            truth: [
                'The term “artificial intelligence” was coined for the 1956 Dartmouth summer workshop. Frank Rosenblatt’s perceptron, an ancestor of today’s neural networks, was demonstrated in 1958.',
                'What is new is scale: vastly more data and computing power.'
            ],
            source: 'McCarthy et al., Dartmouth proposal (1955) · Rosenblatt (1958)',
            hint: 'your cursor feeds the inputs',
            build: buildNeural
        },
        {
            era: 'FUTURE',
            claim: 'A qubit is just a bit that is 0 and 1 at the same time.',
            truth: [
                'A qubit’s state is a point on a sphere — the Bloch sphere — described by continuous amplitudes and a phase. Measuring it still gives a plain 0 or 1, with probabilities set by where the arrow points.',
                'Quantum speed-ups come from interference between amplitudes, and only help on specific kinds of problems.'
            ],
            source: 'Nielsen & Chuang, Quantum Computation and Quantum Information',
            hint: 'cursor steers · drag orbits',
            build: buildBloch
        }
    ];

    /* ---------- shared helpers ---------- */
    function lights(scene) {
        scene.add(new THREE.AmbientLight(0x6a7a70, 0.9));
        const d = new THREE.DirectionalLight(0xffe2b0, 1.3);
        d.position.set(3, 4, 6);
        scene.add(d);
        const p = new THREE.PointLight(GREEN, 1.1, 30);
        p.position.set(-4, -2, 4);
        scene.add(p);
    }
    function lineMat(color, opacity) {
        return new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity == null ? 1 : opacity });
    }
    function btn(label, onClick, pressed) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mini-btn';
        b.textContent = label;
        if (pressed != null) b.setAttribute('aria-pressed', String(pressed));
        b.addEventListener('click', (e) => { e.stopPropagation(); onClick(b); });
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        return b;
    }

    /* ---------- 01 · Antikythera gears ---------- */
    function gearGeometry(teeth, m, depth, holeR) {
        const r = (m * teeth) / 2;
        const tip = r + m * 0.9, root = r - m * 1.1;
        const p = (Math.PI * 2) / teeth;
        const shape = new THREE.Shape();
        for (let i = 0; i < teeth; i++) {
            const a = i * p;
            const pts = [[root, a - 0.3 * p], [tip, a - 0.13 * p], [tip, a + 0.13 * p], [root, a + 0.3 * p]];
            pts.forEach((q, k) => {
                const x = Math.cos(q[1]) * q[0], y = Math.sin(q[1]) * q[0];
                if (i === 0 && k === 0) shape.moveTo(x, y);
                else shape.lineTo(x, y);
            });
        }
        shape.closePath();
        const hole = new THREE.Path();
        hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        if (teeth > 100) {
            /* spoked windows, like the real bronze wheels */
            for (let w = 0; w < 4; w++) {
                const a0 = (w / 4) * Math.PI * 2 + 0.18, a1 = a0 + Math.PI / 2 - 0.36;
                const win = new THREE.Path();
                win.absarc(0, 0, r * 0.82, a0, a1, false);
                win.absarc(0, 0, r * 0.3, a1, a0, true);
                shape.holes.push(win);
            }
        }
        const geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 10 });
        geo.translate(0, 0, -depth / 2);
        return { geo: geo, r: r, p: p, n: teeth };
    }

    function buildGears(ctx) {
        lights(ctx.scene);
        ctx.ctl.o.speed = 0;
        ctx.ctl.o.auto = 0;
        ctx.ctl.o.tilt = 0.35;
        ctx.camera.position.z = 10.2;

        const m = 0.024;
        const bronze = new THREE.MeshStandardMaterial({ color: 0xb08850, metalness: 0.85, roughness: 0.38, emissive: 0x1a1006 });
        const bronzeDark = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.8, roughness: 0.45, emissive: 0x120a04 });
        const group = new THREE.Group();
        group.position.set(0.3, 0.2, 0);
        ctx.root.add(group);

        const make = (teeth, mat, holeR) => {
            const g = gearGeometry(teeth, m, 0.12, holeR);
            const mesh = new THREE.Mesh(g.geo, mat);
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g.geo, 35), lineMat(GOLD, 0.22)));
            const pivot = new THREE.Group();
            pivot.add(mesh);
            group.add(pivot);
            return Object.assign(g, { mesh: mesh, pivot: pivot, angle: 0 });
        };
        const big = make(223, bronze, 0.12);
        const g38 = make(38, bronzeDark, 0.06);
        const g64 = make(64, bronze, 0.06);
        const g27 = make(27, bronzeDark, 0.05);

        const at = (g, x, y, z) => { g.pivot.position.set(x, y, z || 0); };
        at(big, -0.9, -0.3);
        const phi1 = 0.5;
        const d1 = big.r + g38.r;
        at(g38, -0.9 + Math.cos(phi1) * d1, -0.3 + Math.sin(phi1) * d1, 0.02);
        at(g64, g38.pivot.position.x, g38.pivot.position.y, 0.16);
        const phi2 = -0.95;
        const d2 = g64.r + g27.r;
        at(g27, g64.pivot.position.x + Math.cos(phi2) * d2, g64.pivot.position.y + Math.sin(phi2) * d2, 0.16);

        /* initial phases so teeth interlock: phaseA + phaseB ≡ 0.5 */
        const phase = (A, B, phi) => {
            const uA = ((((phi - A.angle) / A.p) % 1) + 1) % 1;
            return phi + Math.PI - B.p * (0.5 - uA);
        };
        g38.angle = phase(big, g38, phi1);
        g64.angle = g38.angle;
        g27.angle = phase(g64, g27, phi2);
        const base = { big: 0, g38: g38.angle, g27: g27.angle };

        /* axles */
        [big, g38, g27].forEach((g) => {
            const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12), bronzeDark);
            ax.rotation.x = Math.PI / 2;
            ax.position.copy(g.pivot.position);
            group.add(ax);
        });
        /* pointer on big wheel */
        const ptr = new THREE.Mesh(new THREE.BoxGeometry(0.04, big.r * 0.9, 0.03), new THREE.MeshBasicMaterial({ color: GREEN }));
        ptr.position.y = big.r * 0.45;
        ptr.position.z = 0.09;
        big.mesh.add(ptr);
        const tipGlow = X3.glow(GREEN, 0.5, 0.9);
        tipGlow.position.set(0, big.r * 0.9, 0.1);
        big.mesh.add(tipGlow);

        let vel = 0.06;
        ctx.ctl.onDrag = (dx) => { vel += dx * 0.004; };

        return function (dt) {
            vel += (0.06 - vel) * Math.min(1, dt * 0.8);
            big.angle += vel * dt;
            const ratio = big.n / g38.n;
            g38.angle = base.g38 - big.angle * ratio;
            g64.angle = g38.angle;
            g27.angle = base.g27 + big.angle * ratio * (g64.n / g27.n);
            big.pivot.rotation.z = big.angle;
            g38.pivot.rotation.z = g38.angle;
            g64.pivot.rotation.z = g64.angle;
            g27.pivot.rotation.z = g27.angle;
            const month = Math.floor(((((big.angle / (Math.PI * 2)) % 1) + 1) % 1) * 223) + 1;
            ctx.hud('SAROS DIAL<br>lunar month <b>' + String(month).padStart(3, '0') + '</b> / 223',
                'gear train<br><b>223 · 38 · 64 · 27</b>');
        };
    }

    /* ---------- 02 · The first "bug" ---------- */
    function buildBug(ctx) {
        lights(ctx.scene);
        ctx.ctl.o.auto = 0;
        ctx.ctl.o.speed = 0.004;
        ctx.ctl.o.tilt = 0.3;
        ctx.camera.position.z = 9;

        const panel = new THREE.Group();
        panel.position.y = -0.2;
        ctx.root.add(panel);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.6, 0.15), new THREE.MeshStandardMaterial({ color: 0x0c1714, metalness: 0.6, roughness: 0.6 }));
        frame.position.z = -0.25;
        panel.add(frame);
        panel.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6.4, 3.6, 0.15)), lineMat(GREEN, 0.25)));

        const relays = [];
        const cols = 8, rows = 4;
        const caseMat = new THREE.MeshStandardMaterial({ color: 0x2a3430, metalness: 0.7, roughness: 0.4 });
        const coilMat = new THREE.MeshStandardMaterial({ color: 0xb07a3a, metalness: 0.6, roughness: 0.35 });
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const g = new THREE.Group();
                g.position.set(-2.8 + c * 0.8, 1.2 - r * 0.8, 0);
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), caseMat);
                const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 14), coilMat);
                coil.position.set(-0.08, 0, 0.2);
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.9, roughness: 0.2 }));
                arm.position.set(0.08, 0.18, 0.2);
                const led = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshBasicMaterial({ color: GREEN }));
                led.position.set(0.17, -0.17, 0.17);
                g.add(body, coil, arm, led);
                panel.add(g);
                relays.push({ g: g, arm: arm, led: led, on: Math.random() < 0.5, next: Math.random() * 2, id: 63 + relays.length });
            }
        }
        const r70 = relays.find((r) => r.id === 70);

        /* the moth: two flapping wings */
        const moth = new THREE.Group();
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.bezierCurveTo(0.12, 0.22, 0.42, 0.26, 0.5, 0.08);
        wingShape.bezierCurveTo(0.46, -0.12, 0.2, -0.2, 0, 0);
        const wingGeo = new THREE.ShapeGeometry(wingShape);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xc9b38a, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x2a2010 });
        const wl = new THREE.Mesh(wingGeo, wingMat);
        const wr = new THREE.Mesh(wingGeo, wingMat);
        wr.scale.x = -1;
        const bodyM = new THREE.Mesh(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.04, 0.22, 4, 8) : new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x6b5a3c }));
        moth.add(wl, wr, bodyM);
        moth.add(X3.glow(GOLD, 0.9, 0.25));
        moth.position.set(0, 0, 1.2);
        ctx.root.add(moth);

        let trapped = false;
        let logged = 0;
        const target = new THREE.Vector3();
        const trap = ctx.addButton('TRAP THE MOTH', (b) => {
            trapped = !trapped;
            b.textContent = trapped ? 'RELEASE' : 'TRAP THE MOTH';
            if (trapped) logged++;
        });
        trap.setAttribute('aria-label', 'Trap or release the moth');

        return function (dt, t) {
            relays.forEach((r) => {
                r.next -= dt;
                if (r.next <= 0 && !(trapped && r === r70)) {
                    r.on = !r.on;
                    r.next = 0.3 + Math.random() * 1.6;
                }
                r.arm.rotation.z += ((r.on ? -0.25 : 0.1) - r.arm.rotation.z) * Math.min(1, dt * 18);
                const fault = trapped && r === r70;
                r.led.material.color.setHex(fault ? RED : r.on ? GREEN : 0x14301f);
            });

            if (trapped) {
                target.set(r70.g.position.x + 0.02, r70.g.position.y + panel.position.y + 0.12, 0.42);
            } else if (ctx.ctl.hover) {
                target.set(ctx.ctl.ndc.x * 3.3, ctx.ctl.ndc.y * 2.1, 1.3 + Math.sin(t * 3) * 0.2);
            } else {
                target.set(Math.sin(t * 0.7) * 2.6, Math.sin(t * 1.3) * 1.2, 1.2 + Math.cos(t) * 0.4);
            }
            const k = Math.min(1, dt * (trapped ? 4 : 2.2));
            const prevX = moth.position.x;
            moth.position.lerp(target, k);
            moth.position.y += trapped ? 0 : Math.sin(t * 9) * 0.01;
            const flap = trapped ? 0.15 : Math.sin(t * 28) * 0.9;
            wl.rotation.y = flap;
            wr.rotation.y = -flap;
            moth.rotation.z = trapped ? 0 : THREE.MathUtils.clamp((moth.position.x - prevX) * -6, -0.5, 0.5);

            ctx.hud(
                trapped ? 'LOGBOOK · 9 SEP 1947<br><b>15:45 Relay #70 Panel F (moth) in relay.</b>' : 'HARVARD MARK II<br>relay panel <b>F</b> · ' + relays.filter((r) => r.on).length + ' closed',
                trapped ? '<b>“First actual case<br>of bug being found.”</b>' : (logged ? 'moths logged: <b>' + logged + '</b>' : '')
            );
        };
    }

    /* ---------- 03 · The cloud is on the sea floor ---------- */
    function buildCables(ctx) {
        lights(ctx.scene);
        ctx.ctl.o.auto = 0.18;
        ctx.ctl.o.minX = -0.7;
        ctx.ctl.o.maxX = 0.7;
        ctx.ctl.rx = 0.35;
        ctx.ctl.ry = -1.2;
        ctx.camera.position.z = 9.6;
        const R = 2.2;
        const globe = new THREE.Group();
        globe.position.y = -0.25;
        ctx.root.add(globe);
        globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.99, 48, 32), new THREE.MeshStandardMaterial({ color: 0x06141a, roughness: 0.9, metalness: 0.2, transparent: true, opacity: 0.92 })));
        globe.add(X3.wireGlobe(R, 10, 12, lineMat(CYAN, 0.1)));

        const ll = (lat, lon, r) => {
            const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
            return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
        };
        const cities = {
            ny: [40.7, -74], lon: [51.5, -0.1], lis: [38.7, -9.1], mar: [43.3, 5.4], mum: [19.1, 72.9], che: [13.1, 80.3],
            sin: [1.35, 103.8], tok: [35.7, 139.7], la: [34, -118], syd: [-33.9, 151.2], cpt: [-33.9, 18.4], for: [-3.7, -38.5]
        };
        Object.keys(cities).forEach((k) => {
            const p = ll(cities[k][0], cities[k][1], R * 1.005);
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshBasicMaterial({ color: GOLD }));
            dot.position.copy(p);
            const g = X3.glow(GOLD, 0.45, 0.8);
            g.position.copy(p);
            globe.add(dot, g);
        });
        const links = [['ny', 'lon'], ['lis', 'for'], ['mar', 'mum'], ['che', 'sin'], ['sin', 'tok'], ['tok', 'la'], ['la', 'syd'], ['cpt', 'lis'], ['ny', 'for'], ['syd', 'sin'], ['mum', 'cpt'], ['lon', 'ny']];
        const curves = [];
        links.forEach((l, i) => {
            if (i === links.length - 1) return;
            const a = ll(cities[l[0]][0], cities[l[0]][1], 1), b = ll(cities[l[1]][0], cities[l[1]][1], 1);
            const pts = [];
            for (let s = 0; s <= 48; s++) {
                const v = new THREE.Vector3().copy(a).lerp(b, s / 48).normalize().multiplyScalar(R * 1.012);
                pts.push(v);
            }
            const curve = new THREE.CatmullRomCurve3(pts);
            curves.push(curve);
            globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)), lineMat(GREEN, 0.75)));
        });
        const pulses = curves.map((c, i) => {
            const s = X3.glow(0xffffff, 0.28, 1);
            globe.add(s);
            return { s: s, c: c, t: i / curves.length, v: 0.18 + Math.random() * 0.12 };
        });

        /* the mythical cloud */
        const cloud = new THREE.Group();
        const puffMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1, emissive: 0x222222 });
        [[0, 0, 0, 0.55], [0.5, 0.1, 0, 0.45], [-0.5, 0.05, 0.1, 0.42], [0.2, 0.35, -0.1, 0.4], [-0.25, 0.3, 0, 0.38]].forEach((p) => {
            const s = new THREE.Mesh(new THREE.SphereGeometry(p[3], 20, 16), puffMat);
            s.position.set(p[0], p[1], p[2]);
            cloud.add(s);
        });
        cloud.position.set(0, 2.45, 0);
        ctx.scene.add(cloud);
        ctx.onBust = () => { cloud.userData.gone = true; };

        return function (dt, t) {
            globe.rotation.x = ctx.ctl.x;
            globe.rotation.y = ctx.ctl.y;
            ctx.root.rotation.set(0, 0, 0);
            pulses.forEach((p) => {
                p.t = (p.t + dt * p.v) % 1;
                p.c.getPoint(p.t, p.s.position);
            });
            cloud.position.x = Math.sin(t * 0.4) * 0.6;
            const targetOp = cloud.userData.gone ? 0 : 0.35;
            puffMat.opacity += (targetOp - puffMat.opacity) * Math.min(1, dt * 2);
            cloud.position.y = 2.45 + (cloud.userData.gone ? (0.35 - puffMat.opacity) * 4 : Math.sin(t) * 0.08);
            ctx.hud(cloud.userData.gone ? 'CLOUD <b>DISSOLVED</b><br>it was cables all along' : 'SUBMARINE FIBRE<br><b>' + curves.length + '</b> cable routes shown',
                'data centres <b>●</b>');
        };
    }

    /* ---------- 04 · Moore's law ---------- */
    function buildMoore(ctx) {
        lights(ctx.scene);
        ctx.ctl.o.auto = 0;
        ctx.ctl.o.minX = -0.3;
        ctx.ctl.o.maxX = 0.6;
        ctx.ctl.rx = 0.25;
        ctx.ctl.ry = -0.35;
        ctx.camera.position.set(0, 0.6, 9.4);
        const chips = [
            ['Intel 4004', 1971, 2300], ['Intel 8086', 1978, 29000], ['Intel 80386', 1985, 275000], ['Pentium', 1993, 3.1e6],
            ['Pentium 4', 2000, 4.2e7], ['Core 2 Duo', 2006, 2.91e8], ['Apple M1', 2020, 1.6e10], ['M1 Ultra', 2022, 1.14e11]
        ];
        const x = (y) => -3.1 + ((y - 1971) / (2022 - 1971)) * 6.2;
        const h = (n) => (Math.log10(n) - 3) * 0.48 + 0.05;
        const g = new THREE.Group();
        g.position.y = -1.6;
        ctx.root.add(g);
        const grid = new THREE.GridHelper(7.2, 18, 0x1f6b44, 0x0f3322);
        grid.material.transparent = true;
        grid.material.opacity = 0.5;
        g.add(grid);
        const cA = new THREE.Color(0x1f8f6a), cB = new THREE.Color(GOLD);
        const bars = chips.map((c, i) => {
            const hh = h(c[2]);
            const col = cA.clone().lerp(cB, i / (chips.length - 1));
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, hh, 0.42), new THREE.MeshStandardMaterial({ color: col, emissive: col.clone().multiplyScalar(0.25), metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.92 }));
            mesh.position.set(x(c[1]), hh / 2, 0);
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), lineMat(0xffffff, 0.25)));
            const top = X3.glow(col, 0.6, 0.6);
            top.position.y = hh / 2;
            mesh.add(top);
            mesh.userData = { chip: c, base: col, h: hh };
            g.add(mesh);
            return mesh;
        });
        /* doubling-every-two-years trend */
        const trend = [];
        for (let y = 1971; y <= 2022; y += 1) trend.push(new THREE.Vector3(x(y), h(2300 * Math.pow(2, (y - 1971) / 2)), 0.5));
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(trend), new THREE.LineDashedMaterial({ color: CYAN, dashSize: 0.12, gapSize: 0.08 })));
        g.children[g.children.length - 1].computeLineDistances();

        const ray = new THREE.Raycaster();
        let hot = null;
        const fmt = (n) => n >= 1e9 ? (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + ' billion' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + ' million' : n.toLocaleString('en-US');
        let grow = 0;

        return function (dt) {
            grow = Math.min(1, grow + dt * 0.6);
            ray.setFromCamera(ctx.ctl.ndc, ctx.camera);
            const hit = ctx.ctl.hover ? ray.intersectObjects(bars, false)[0] : null;
            hot = hit ? hit.object : null;
            bars.forEach((b, i) => {
                const e = Math.min(1, Math.max(0, grow * 1.6 - i * 0.08));
                b.scale.y = Math.max(0.001, 1 - Math.pow(1 - e, 3));
                b.position.y = (b.userData.h * b.scale.y) / 2;
                b.material.emissive.copy(b.userData.base).multiplyScalar(b === hot ? 0.8 : 0.25);
            });
            const c = hot ? hot.userData.chip : chips[chips.length - 1];
            ctx.hud('<b>' + c[0] + '</b> · ' + c[1] + '<br>' + fmt(c[2]) + ' transistors',
                '<span style="color:#4de1ff">- - -</span> doubling<br>every 2 years');
        };
    }

    /* ---------- 05 · Neural net (AI is old) ---------- */
    function buildNeural(ctx) {
        lights(ctx.scene);
        ctx.ctl.o.auto = 0;
        ctx.ctl.o.speed = 0.004;
        ctx.ctl.o.minX = -0.5;
        ctx.ctl.o.maxX = 0.5;
        ctx.ctl.ry = -0.35;
        ctx.camera.position.z = 8.6;
        const sizes = [4, 6, 6, 3];
        const layers = [];
        const nodeGeo = new THREE.SphereGeometry(0.13, 16, 16);
        sizes.forEach((n, li) => {
            const layer = [];
            for (let i = 0; i < n; i++) {
                const mat = new THREE.MeshBasicMaterial({ color: GREEN });
                const m = new THREE.Mesh(nodeGeo, mat);
                m.position.set(-3 + li * 2, ((n - 1) / 2 - i) * 0.62, Math.sin(i * 1.7 + li) * 0.4);
                const glow = X3.glow(GREEN, 0.8, 0.5);
                m.add(glow);
                ctx.root.add(m);
                layer.push({ m: m, glow: glow, a: 0 });
            }
            layers.push(layer);
        });
        /* deterministic pseudo-random weights */
        let seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) * 2 - 1; };
        const conns = [];
        for (let li = 0; li < layers.length - 1; li++) {
            layers[li].forEach((a, i) => {
                layers[li + 1].forEach((b, j) => {
                    const w = rnd() * 1.6;
                    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a.m.position, b.m.position]),
                        new THREE.LineBasicMaterial({ color: w > 0 ? GREEN : VIOLET, transparent: true, opacity: 0.2 }));
                    ctx.root.add(line);
                    conns.push({ li: li, i: i, j: j, w: w, line: line });
                });
            });
        }
        const pulses = [];
        for (let k = 0; k < 18; k++) {
            const s = X3.glow(0xffffff, 0.22, 0.9);
            ctx.root.add(s);
            pulses.push({ s: s, c: conns[(Math.random() * conns.length) | 0], t: Math.random() });
        }
        const labels = ['class A', 'class B', 'class C'];
        const cIn = new THREE.Color(CYAN), cOut = new THREE.Color(GOLD), cMid = new THREE.Color(GREEN);

        return function (dt, t) {
            const nx = ctx.ctl.hover ? ctx.ctl.ndc.x : Math.sin(t * 0.6);
            const ny = ctx.ctl.hover ? ctx.ctl.ndc.y : Math.cos(t * 0.45);
            const inputs = [nx, ny, nx * ny, Math.sin(nx * 3 + ny)];
            layers[0].forEach((n, i) => { n.a = inputs[i]; });
            for (let li = 1; li < layers.length; li++) {
                layers[li].forEach((n, j) => {
                    let s = 0;
                    conns.forEach((c) => { if (c.li === li - 1 && c.j === j) s += c.w * layers[li - 1][c.i].a; });
                    n.a = Math.tanh(s);
                });
            }
            let best = 0;
            layers[layers.length - 1].forEach((n, j) => { if (n.a > layers[layers.length - 1][best].a) best = j; });
            layers.forEach((layer, li) => {
                layer.forEach((n, j) => {
                    const v = (n.a + 1) / 2;
                    const col = li === 0 ? cIn : li === layers.length - 1 ? cOut : cMid;
                    n.m.material.color.copy(col).multiplyScalar(0.25 + v * 0.9);
                    n.glow.material.opacity = 0.15 + v * 0.7;
                    const s = li === layers.length - 1 && j === best ? 1.6 : 1;
                    n.m.scale.setScalar(s);
                });
            });
            conns.forEach((c) => {
                const act = Math.abs(layers[c.li][c.i].a * c.w);
                c.line.material.opacity = 0.06 + Math.min(0.7, act * 0.5);
            });
            pulses.forEach((p) => {
                p.t += dt * 1.2;
                if (p.t > 1) {
                    p.t = 0;
                    p.c = conns[(Math.random() * conns.length) | 0];
                }
                const a = layers[p.c.li][p.c.i].m.position, b = layers[p.c.li + 1][p.c.j].m.position;
                p.s.position.copy(a).lerp(b, p.t);
                p.s.material.opacity = Math.min(1, Math.abs(layers[p.c.li][p.c.i].a * p.c.w)) * Math.sin(p.t * Math.PI);
            });
            ctx.hud('PERCEPTRON STACK<br>input <b>(' + nx.toFixed(2) + ', ' + ny.toFixed(2) + ')</b>', 'output<br><b>' + labels[best] + '</b>');
        };
    }

    /* ---------- 06 · Bloch sphere ---------- */
    function buildBloch(ctx) {
        lights(ctx.scene);
        ctx.ctl.o.auto = 0.08;
        ctx.ctl.o.tilt = 0;
        ctx.ctl.rx = 0.3;
        ctx.ctl.ry = -0.6;
        ctx.camera.position.z = 9.6;
        const R = 2;
        const g = new THREE.Group();
        ctx.root.add(g);
        g.add(X3.wireGlobe(R, 8, 8, lineMat(GREEN, 0.12)));
        g.add(X3.circle(R, 96, lineMat(GOLD, 0.5), 'y'));
        const axis = (v, color) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([v.clone().multiplyScalar(-1.2), v.clone().multiplyScalar(1.2)]), lineMat(color, 0.45)));
        axis(new THREE.Vector3(0, R, 0), GREEN);
        axis(new THREE.Vector3(R, 0, 0), CYAN);
        axis(new THREE.Vector3(0, 0, R), CYAN);
        const lbl = (txt, pos, color) => {
            const s = X3.textSprite(txt, { color: color, size: 44, height: 0.34 });
            s.position.copy(pos);
            g.add(s);
        };
        lbl('|0⟩', new THREE.Vector3(0, R * 1.32, 0), '#3dff8f');
        lbl('|1⟩', new THREE.Vector3(0, -R * 1.32, 0), '#3dff8f');
        lbl('|+⟩', new THREE.Vector3(0, 0, R * 1.32), '#4de1ff');
        lbl('|−⟩', new THREE.Vector3(0, 0, -R * 1.32), '#4de1ff');

        const arrow = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, R * 0.86, 12), new THREE.MeshStandardMaterial({ color: GOLD, emissive: 0x4a3410, metalness: 0.6, roughness: 0.3 }));
        shaft.position.y = R * 0.43;
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 18), new THREE.MeshStandardMaterial({ color: GOLD, emissive: 0x6a4a10 }));
        head.position.y = R * 0.86 + 0.14;
        const tip = X3.glow(GOLD, 0.9, 0.9);
        tip.position.y = R;
        arrow.add(shaft, head, tip);
        g.add(arrow);
        g.add(X3.glow(GREEN, 1.4, 0.4));

        /* projection lines to the equator */
        const projGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const proj = new THREE.Line(projGeo, new THREE.LineDashedMaterial({ color: CYAN, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.7 }));
        g.add(proj);

        let theta = 0.9, phi = 0.6, tT = theta, tP = phi;
        let collapse = 0, collapseTo = null;
        const tally = [0, 0];
        ctx.addButton('MEASURE', () => {
            const p0 = Math.cos(theta / 2) ** 2;
            const r = Math.random() < p0 ? 0 : 1;
            tally[r]++;
            collapseTo = r;
            collapse = 1.2;
        });
        ctx.addButton('RESET', () => { tally[0] = tally[1] = 0; collapseTo = null; collapse = 0; });

        const tmp = new THREE.Vector3();
        const q = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        return function (dt) {
            if (ctx.ctl.hover && !ctx.ctl.dragging && collapse <= 0) {
                tT = THREE.MathUtils.clamp((1 - ctx.ctl.ndc.y) / 2, 0, 1) * Math.PI;
                tP = ctx.ctl.ndc.x * Math.PI;
            }
            if (collapse > 0) {
                collapse -= dt;
                tT = collapseTo === 0 ? 0.0001 : Math.PI - 0.0001;
            }
            theta += (tT - theta) * Math.min(1, dt * (collapse > 0 ? 10 : 5));
            phi += (tP - phi) * Math.min(1, dt * 5);
            tmp.set(Math.sin(theta) * Math.sin(phi), Math.cos(theta), Math.sin(theta) * Math.cos(phi));
            q.setFromUnitVectors(up, tmp);
            arrow.quaternion.copy(q);
            const pos = projGeo.attributes.position;
            pos.setXYZ(0, tmp.x * R, tmp.y * R, tmp.z * R);
            pos.setXYZ(1, tmp.x * R, 0, tmp.z * R);
            pos.needsUpdate = true;
            proj.computeLineDistances();

            const p0 = Math.cos(theta / 2) ** 2;
            ctx.hud('θ <b>' + THREE.MathUtils.radToDeg(theta).toFixed(0) + '°</b> φ <b>' + THREE.MathUtils.radToDeg(phi).toFixed(0) + '°</b><br>P(0) <b>' + (p0 * 100).toFixed(0) + '%</b> · P(1) <b>' + ((1 - p0) * 100).toFixed(0) + '%</b>',
                'measured<br>0 → <b>' + tally[0] + '</b> · 1 → <b>' + tally[1] + '</b>');
        };
    }

    /* ---------- card + shared renderer ---------- */
    window.initMyths = function (grid) {
        const cards = [];
        MYTHS.forEach((m, i) => {
            const art = document.createElement('article');
            art.className = 'myth panel reveal';
            art.innerHTML =
                '<div class="myth-top"><span class="myth-id">MYTH <b>' + String(i + 1).padStart(2, '0') + '</b></span><span class="myth-era">' + m.era + '</span></div>' +
                '<div class="myth-stage" data-cursor="drag"><canvas></canvas><div class="myth-hud"><span class="l"></span><span class="r"></span></div><div class="myth-controls"></div><div class="myth-drag">' + m.hint + '</div></div>' +
                '<div class="myth-body"><p class="myth-claim">' + m.claim + '</p>' +
                '<div class="myth-truth"><div>' + m.truth.map((p) => '<p>' + p + '</p>').join('') + '<small>Source · ' + m.source + '</small></div></div>' +
                '<div class="myth-foot"><button class="btn btn-sm bust-btn" type="button" data-cursor="bust"><span class="g">✕</span><span class="lbl">Bust it</span></button><span class="busted-stamp">BUSTED</span></div></div>';
            grid.appendChild(art);
            const stage = art.querySelector('.myth-stage');
            const card = {
                art: art, stage: stage, canvas: stage.querySelector('canvas'),
                hudL: stage.querySelector('.myth-hud .l'), hudR: stage.querySelector('.myth-hud .r'),
                controls: stage.querySelector('.myth-controls'), def: m, onBust: null, lastHud: ''
            };
            card.ctx2d = card.canvas.getContext('2d');
            const bust = art.querySelector('.bust-btn');
            bust.addEventListener('click', () => {
                const on = art.classList.toggle('busted');
                bust.querySelector('.lbl').textContent = on ? 'Show myth' : 'Bust it';
                bust.querySelector('.g').textContent = on ? '↺' : '✕';
                if (on && card.onBust) card.onBust();
                if (!on && card.onUnbust) card.onUnbust();
            });
            cards.push(card);
        });

        if (!window.X3 || !X3.ok) {
            cards.forEach((c) => {
                const f = document.createElement('div');
                f.className = 'myth-fallback';
                f.textContent = '3D preview unavailable on this device.';
                c.stage.appendChild(f);
            });
            return;
        }

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1);
        renderer.setClearColor(0x000000, 0);
        let rw = 0, rh = 0;

        cards.forEach((c) => {
            c.scene = new THREE.Scene();
            c.camera = new THREE.PerspectiveCamera(38, 1.5, 0.1, 100);
            c.camera.position.set(0, 0, 9);
            c.root = new THREE.Group();
            c.scene.add(c.root);
            c.ctl = new X3.DragRotate(c.stage, { auto: 0.15, tilt: 0.25, minX: -0.9, maxX: 0.9 });
            const api = {
                scene: c.scene, camera: c.camera, root: c.root, ctl: c.ctl,
                hud: (l, r) => {
                    const key = l + '|' + r;
                    if (key === c.lastHud) return;
                    c.lastHud = key;
                    c.hudL.innerHTML = l;
                    c.hudR.innerHTML = r || '';
                    c.hudR.className = 'r';
                },
                addButton: (label, fn, pressed) => {
                    const b = btn(label, fn, pressed);
                    c.controls.appendChild(b);
                    return b;
                }
            };
            Object.defineProperty(api, 'onBust', { set: (fn) => { c.onBust = fn; } });
            Object.defineProperty(api, 'onUnbust', { set: (fn) => { c.onUnbust = fn; } });
            c.update = c.def.build(api);
            if (c.def.build === buildCables) c.onUnbust = () => { c.scene.children.forEach((o) => { if (o.userData && 'gone' in o.userData) o.userData.gone = false; }); };
            c.vis = X3.watch(c.stage);
        });

        const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);
        let last = performance.now();
        const loop = (now) => {
            requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (document.hidden) return;
            const t = now / 1000;
            cards.forEach((c) => {
                if (!c.vis.visible) return;
                const cw = c.stage.clientWidth, ch = c.stage.clientHeight;
                if (!cw || !ch) return;
                const w = Math.round(cw * dpr()), h = Math.round(ch * dpr());
                if (c.canvas.width !== w || c.canvas.height !== h) {
                    c.canvas.width = w;
                    c.canvas.height = h;
                }
                if (w > rw || h > rh) {
                    rw = Math.max(rw, w);
                    rh = Math.max(rh, h);
                    renderer.setSize(rw, rh, false);
                }
                c.camera.aspect = cw / ch;
                c.camera.updateProjectionMatrix();
                c.ctl.update(dt);
                c.root.rotation.x = c.ctl.x;
                c.root.rotation.y = c.ctl.y;
                c.update(dt, t);
                renderer.setViewport(0, 0, w, h);
                renderer.setScissor(0, 0, w, h);
                renderer.setScissorTest(true);
                renderer.clear();
                renderer.render(c.scene, c.camera);
                c.ctx2d.clearRect(0, 0, w, h);
                c.ctx2d.drawImage(renderer.domElement, 0, rh - h, w, h, 0, 0, w, h);
            });
        };
        requestAnimationFrame(loop);
    };
})();
