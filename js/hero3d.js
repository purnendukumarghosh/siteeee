/* Hero: an astrolabe-like artifact — ancient bronze rings around a digital core. */
(function () {
    'use strict';

    const GREEN = 0x3dff8f;
    const GOLD = 0xe7b75f;
    const CYAN = 0x4de1ff;
    const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';

    window.initHero = function (container, readout) {
        if (!window.X3 || !X3.ok) {
            container.classList.add('no-webgl');
            return;
        }

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(X3.dpr());
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x05070a, 10, 24);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0, 0.3, 10);

        const rig = new THREE.Group();
        const art = new THREE.Group();
        rig.add(art);
        scene.add(rig);

        /* --- Core --- */
        const coreGeo = new THREE.IcosahedronGeometry(1.1, 1);
        const core = new THREE.Group();
        core.add(new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0x03140b, transparent: true, opacity: 0.88 })));
        const coreEdges = new THREE.LineSegments(
            new THREE.EdgesGeometry(coreGeo),
            new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.85 })
        );
        core.add(coreEdges);
        core.add(new THREE.Points(coreGeo, new THREE.PointsMaterial({
            color: GREEN, size: 0.12, map: X3.glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        })));
        const inner = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.55, 0)),
            new THREE.LineBasicMaterial({ color: GOLD })
        );
        core.add(inner);
        core.add(X3.glow(GREEN, 6.5, 0.22));
        core.add(X3.glow(GOLD, 1.8, 0.55));
        art.add(core);

        /* Scanner ring sweeping over the core */
        const scanMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.8 });
        const scan = X3.circle(1, 64, scanMat, 'y');
        art.add(scan);

        /* --- Astrolabe rings --- */
        const ringDefs = [
            { r: 2.0, color: GOLD, tilt: [1.25, 0.2], speed: 0.22, ticks: 60 },
            { r: 2.7, color: GREEN, tilt: [1.7, -0.55], speed: -0.13, ticks: 96, runes: true },
            { r: 3.45, color: GOLD, tilt: [0.95, 0.8], speed: 0.07, ticks: 120 }
        ];
        const spins = [];
        const runeHolders = [];
        ringDefs.forEach((d, idx) => {
            const holder = new THREE.Group();
            holder.rotation.set(d.tilt[0], d.tilt[1], 0);
            const spin = new THREE.Group();
            holder.add(spin);
            art.add(holder);

            spin.add(new THREE.Mesh(
                new THREE.TorusGeometry(d.r, 0.014, 6, 180),
                new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.9 })
            ));
            spin.add(X3.circle(d.r + 0.1, 160, new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.25 })));

            const tick = [];
            for (let i = 0; i < d.ticks; i++) {
                const a = (i / d.ticks) * Math.PI * 2;
                const len = i % 6 === 0 ? 0.2 : 0.08;
                const c = Math.cos(a), s = Math.sin(a);
                tick.push(c * (d.r - len), s * (d.r - len), 0, c * d.r, s * d.r, 0);
            }
            const tg = new THREE.BufferGeometry();
            tg.setAttribute('position', new THREE.Float32BufferAttribute(tick, 3));
            spin.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.6 })));

            for (let b = 0; b < 2; b++) {
                const a = b * Math.PI + idx;
                const bead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: idx === 1 ? GOLD : GREEN }));
                bead.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0);
                bead.add(X3.glow(idx === 1 ? GOLD : GREEN, 0.7, 0.8));
                spin.add(bead);
            }
            if (d.runes) runeHolders.push({ spin: spin, r: d.r + 0.38 });
            spins.push({ g: spin, speed: d.speed });
        });

        /* Runes need their webfont before being painted to canvas. */
        const addRunes = () => {
            runeHolders.forEach((h) => {
                for (let i = 0; i < RUNES.length; i++) {
                    const a = (i / RUNES.length) * Math.PI * 2;
                    const sp = X3.textSprite(RUNES[i], { color: '#e7b75f', size: 64, font: '"Noto Sans Runic", "Segoe UI Historic", sans-serif', weight: 400, height: 0.3, pad: 6 });
                    sp.material.opacity = 0.85;
                    sp.position.set(Math.cos(a) * h.r, Math.sin(a) * h.r, 0);
                    h.spin.add(sp);
                }
            });
        };
        if (document.fonts && document.fonts.load) {
            Promise.race([
                document.fonts.load('64px "Noto Sans Runic"', 'ᚠ'),
                new Promise((r) => setTimeout(r, 2500))
            ]).then(addRunes, addRunes);
        } else {
            addRunes();
        }

        /* Polar grid floor, like an engraved base plate */
        const floor = new THREE.PolarGridHelper(6.5, 24, 8, 96, 0x1f6b44, 0x0f3322);
        floor.material.transparent = true;
        floor.material.opacity = 0.45;
        floor.position.y = -3.6;
        rig.add(floor);

        /* --- Data-dust starfield --- */
        const N = X3.small() ? 700 : 1500;
        const pos = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        const cg = new THREE.Color(GREEN), cy = new THREE.Color(GOLD), cc = new THREE.Color(CYAN);
        for (let i = 0; i < N; i++) {
            const v = new THREE.Vector3().randomDirection ? new THREE.Vector3().randomDirection() : new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            const r = 5 + Math.pow(Math.random(), 0.7) * 12;
            pos[i * 3] = v.x * r;
            pos[i * 3 + 1] = v.y * r * 0.7;
            pos[i * 3 + 2] = v.z * r;
            const pick = Math.random();
            const c = pick < 0.14 ? cy : pick < 0.22 ? cc : cg;
            const k = 0.35 + Math.random() * 0.65;
            col[i * 3] = c.r * k;
            col[i * 3 + 1] = c.g * k;
            col[i * 3 + 2] = c.b * k;
        }
        const pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const dust = new THREE.Points(pg, new THREE.PointsMaterial({
            size: 0.09, map: X3.glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        }));
        scene.add(dust);

        /* --- Interaction --- */
        const ctl = new X3.DragRotate(container, { auto: 0.18, tilt: 0.35, minX: -0.9, maxX: 0.9, startX: 0.15 });
        let spinBoost = 0;
        ctl.onDrag = (dx) => { spinBoost = Math.min(3, spinBoost + Math.abs(dx) * 0.01); };

        /* --- Layout --- */
        let halfW = 4;
        const layout = () => {
            const w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            halfW = Math.tan(THREE.MathUtils.degToRad(21)) * camera.position.z * camera.aspect;
            if (camera.aspect > 1.05) {
                rig.position.set(halfW * 0.46, 0.1, 0);
                rig.scale.setScalar(Math.min(1, halfW / 6));
            } else {
                rig.position.set(0, 1.6, 0);
                rig.scale.setScalar(0.72);
            }
        };
        layout();
        if ('ResizeObserver' in window) new ResizeObserver(layout).observe(container);
        else window.addEventListener('resize', layout);

        const vis = X3.watch(container);
        let intro = 0;
        let introStarted = !!window.__pkgBooted;
        window.addEventListener('pkg:booted', () => { introStarted = true; });

        let last = performance.now();
        let lastReadout = 0;
        const loop = (now) => {
            requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!vis.visible || document.hidden) return;
            const t = now / 1000;

            if (introStarted && intro < 1) intro = Math.min(1, intro + dt / 1.6);
            const e = introStarted ? 1 - Math.pow(1 - intro, 3) : 0.001;
            art.scale.setScalar(0.4 + 0.6 * e);

            ctl.update(dt);
            art.rotation.x = ctl.x;
            art.rotation.y = ctl.y;

            spinBoost *= 0.96;
            const sp = X3.reduced ? 0.3 : 1;
            spins.forEach((s) => { s.g.rotation.z += s.speed * dt * sp * (1 + spinBoost); });
            core.rotation.y += dt * 0.25 * sp;
            inner.rotation.x -= dt * 0.6 * sp;
            inner.rotation.y += dt * 0.4 * sp;
            coreEdges.material.opacity = 0.65 + Math.sin(t * 2) * 0.2;

            const sy = Math.sin(t * 0.9) * 1.05;
            scan.position.y = sy;
            scan.scale.setScalar(Math.sqrt(Math.max(0.02, 1.25 * 1.25 - sy * sy)));
            scanMat.opacity = 0.35 + 0.45 * (1 - Math.abs(sy) / 1.05);

            dust.rotation.y += dt * 0.012;
            dust.rotation.x = Math.sin(t * 0.05) * 0.05;

            const scrollP = Math.min(1, window.scrollY / (container.clientHeight || 1));
            camera.position.z = 10 + scrollP * 3.5;
            camera.position.y = 0.3 - scrollP * 1.2;
            camera.lookAt(rig.position.x * 0.15, 0, 0);
            renderer.domElement.style.opacity = String(1 - scrollP * 0.7);

            if (readout && now - lastReadout > 120) {
                lastReadout = now;
                const deg = (r) => ((THREE.MathUtils.radToDeg(r) % 360) + 360) % 360;
                readout.textContent = 'θ ' + deg(ctl.x).toFixed(1).padStart(5, '0') + '° · φ ' + deg(ctl.y).toFixed(1).padStart(5, '0') + '°';
            }

            renderer.render(scene, camera);
        };
        requestAnimationFrame(loop);
    };
})();
