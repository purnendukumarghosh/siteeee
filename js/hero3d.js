/* Hero: the portrait as 3D colour-ASCII particles.
   Every character is one GPU instance (single draw call). The cursor scatters
   nearby glyphs in 3D, a click bursts them, a red scan line and glitch bands
   pass over the face, and a light relief gives the portrait depth. */
(function () {
    'use strict';

    const VERT = `
        attribute vec3 aOffset;
        attribute vec3 aColor;
        attribute float aGlyph;
        attribute float aSeed;
        uniform float uTime, uHover, uRadius, uStrength, uIntro, uBurst, uGlitchY, uGlitchH, uGlitchAmt, uScanY;
        uniform vec3 uMouse;
        uniform vec2 uBurstC;
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vGlyph, vScatter, vAlpha;
        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        void main() {
            float s1 = hash(aSeed * 91.7), s2 = hash(aSeed * 13.3 + 1.0), s3 = hash(aSeed * 47.1 + 2.0);
            vec3 p = aOffset;

            /* intro: glyphs fly in from a scattered cloud */
            vec3 from = vec3((s1 - 0.5) * 44.0, (s2 - 0.5) * 30.0, (s3 - 0.5) * 34.0 + 8.0);
            float k = clamp(uIntro * 1.7 - aSeed * 0.7, 0.0, 1.0);
            k = k * k * (3.0 - 2.0 * k);
            p = mix(from, p, k);

            /* cursor scatter */
            vec2 d = p.xy - uMouse.xy;
            float dist = length(d);
            float f = (1.0 - smoothstep(0.0, uRadius, dist)) * uHover;
            f = f * f * (3.0 - 2.0 * f);
            vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0, 1.0);
            vec2 swirl = vec2(-dir.y, dir.x) * (s1 - 0.5) * 1.8;
            p.xy += (dir * (0.8 + s2 * 1.8) + swirl) * f * uStrength;
            p.z += f * uStrength * (1.2 + s3 * 3.8);

            /* click burst */
            vec2 bd = aOffset.xy - uBurstC;
            float bl = length(bd) + 1e-4;
            float bf = uBurst * (0.5 + s1) * exp(-bl * 0.09);
            p.xy += (bd / bl) * bf * (2.5 + 7.0 * s2);
            p.z += bf * (3.0 + 9.0 * s3);

            /* idle breathing + glitch band */
            p.z += sin(uTime * 1.3 + aOffset.y * 0.9 + aOffset.x * 0.4) * 0.05;
            float band = step(abs(aOffset.y - uGlitchY), uGlitchH);
            p.x += band * uGlitchAmt * (s1 - 0.35) * 1.4;

            /* camera-facing quad, spun while scattered */
            float spin = f * (s2 - 0.5) * 3.2 + bf * (s3 - 0.5) * 5.0;
            float c = cos(spin), sn = sin(spin);
            vec2 q = vec2(position.x * c - position.y * sn, position.x * sn + position.y * c) * (1.0 + f * 0.45);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            mv.xy += q;
            gl_Position = projectionMatrix * mv;

            vUv = uv;
            vGlyph = aGlyph;
            vScatter = max(f, min(1.0, bf));
            vec3 red = vec3(1.0, 0.23, 0.33);
            vec3 col = mix(aColor, red, band * 0.85);
            float scan = exp(-pow((aOffset.y - uScanY) / 0.16, 2.0));
            col = mix(col, red, scan * 0.55) + red * scan * 0.25;
            vColor = mix(col, col * 1.35 + vec3(0.06), f);
            vAlpha = k;
        }`;

    const FRAG = `
        uniform sampler2D uAtlas;
        uniform vec2 uGrid;
        uniform float uTint;
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vGlyph, vScatter, vAlpha;
        void main() {
            float gi = floor(vGlyph + 0.5);
            vec2 cell = vec2(mod(gi, uGrid.x), floor(gi / uGrid.x));
            vec2 t = vec2((cell.x + vUv.x) / uGrid.x, (uGrid.y - cell.y - 1.0 + vUv.y) / uGrid.y);
            float g = texture2D(uAtlas, t).r;
            float tint = uTint * (1.0 - clamp(vScatter * 2.2, 0.0, 1.0));
            float a = g + tint * (1.0 - g);
            if (a * vAlpha < 0.01) discard;
            gl_FragColor = vec4(vColor, a * vAlpha);
        }`;

    function decode(P) {
        const bin = atob(P.rgb);
        const rgb = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) rgb[i] = bin.charCodeAt(i);
        return rgb;
    }

    /* Glyph atlas drawn with the same font, size and cell box the offline converter matched against. */
    function buildAtlas(P, glyphs) {
        const S = 2;
        const cw = P.cw * S, ch = P.ch * S, cols = 16, rows = Math.ceil(glyphs.length / cols);
        const c = document.createElement('canvas');
        c.width = cw * cols;
        c.height = ch * rows;
        const g = c.getContext('2d');
        g.fillStyle = '#000';
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#fff';
        g.font = '700 ' + P.fontSize * S + 'px "JetBrains Mono", ui-monospace, monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        glyphs.forEach((chr, i) => {
            g.fillText(chr, (i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch / 2 + S);
        });
        const tex = new THREE.CanvasTexture(c);
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return { tex: tex, grid: new THREE.Vector2(cols, rows), canvas: c, redraw: () => { buildAtlasInto(g, c, P, glyphs, S, cw, ch, cols); tex.needsUpdate = true; } };
    }
    function buildAtlasInto(g, c, P, glyphs, S, cw, ch, cols) {
        g.fillStyle = '#000';
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#fff';
        g.font = '700 ' + P.fontSize * S + 'px "JetBrains Mono", ui-monospace, monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        glyphs.forEach((chr, i) => g.fillText(chr, (i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch / 2 + S));
    }

    /* No WebGL: draw the colour ASCII once on a 2D canvas. */
    function fallback2D(container, P) {
        const rgb = decode(P);
        const c = document.createElement('canvas');
        const scale = 2;
        c.width = P.cols * P.cw / 4 * scale;
        c.height = P.rows * P.ch / 4 * scale;
        c.className = 'hero-ascii-2d';
        const g = c.getContext('2d');
        const cw = c.width / P.cols, ch = c.height / P.rows;
        g.font = '700 ' + ch * 0.8 + 'px "JetBrains Mono", monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        for (let y = 0; y < P.rows; y++) {
            for (let x = 0; x < P.cols; x++) {
                const chr = P.text[y][x];
                if (chr === ' ') continue;
                const i = (y * P.cols + x) * 3;
                g.fillStyle = 'rgba(' + rgb[i] + ',' + rgb[i + 1] + ',' + rgb[i + 2] + ',0.22)';
                g.fillRect(x * cw, y * ch, cw, ch);
                g.fillStyle = 'rgb(' + rgb[i] + ',' + rgb[i + 1] + ',' + rgb[i + 2] + ')';
                g.fillText(chr, x * cw + cw / 2, y * ch + ch / 2);
            }
        }
        container.appendChild(c);
    }

    window.initHero = function (container, readout) {
        const P = window.PORTRAIT;
        if (!P) return;
        if (!window.X3 || !X3.ok) {
            container.classList.add('no-webgl');
            fallback2D(container, P);
            return;
        }

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(X3.dpr());
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
        camera.position.set(0, 0, 27);

        const rig = new THREE.Group();
        const portrait = new THREE.Group();
        rig.add(portrait);
        scene.add(rig);

        /* ---------- glyph instances ---------- */
        const rgb = decode(P);
        const glyphs = [];
        const gIndex = {};
        const offsets = [], colors = [], gids = [], seeds = [];
        const W = 12;                                  // portrait width in world units
        const cw = W / P.cols, ch = cw * (P.ch / P.cw);
        const H = ch * P.rows;
        for (let y = 0; y < P.rows; y++) {
            for (let x = 0; x < P.cols; x++) {
                const chr = P.text[y][x];
                if (chr === ' ') continue;
                if (gIndex[chr] === undefined) {
                    gIndex[chr] = glyphs.length;
                    glyphs.push(chr);
                }
                const i = (y * P.cols + x) * 3;
                const r = rgb[i] / 255, gg = rgb[i + 1] / 255, b = rgb[i + 2] / 255;
                const lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
                const px = (x + 0.5 - P.cols / 2) * cw;
                const py = (P.rows / 2 - y - 0.5) * ch;
                const rr = Math.min(1, Math.sqrt(px * px + py * py) / (W / 2));
                offsets.push(px, py, 1.1 * (1 - rr * rr) + (lum - 0.4) * 0.7);
                colors.push(r, gg, b);
                gids.push(gIndex[chr]);
                seeds.push(Math.random());
            }
        }
        const count = gids.length;
        const atlas = buildAtlas(P, glyphs);
        if (document.fonts && document.fonts.load) {
            document.fonts.load('700 92px "JetBrains Mono"').then(() => atlas.redraw()).catch(() => {});
        }

        const base = new THREE.PlaneGeometry(cw * 1.02, ch * 1.02);
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = base.index;
        geo.setAttribute('position', base.attributes.position);
        geo.setAttribute('uv', base.attributes.uv);
        geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
        geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(colors), 3));
        geo.setAttribute('aGlyph', new THREE.InstancedBufferAttribute(new Float32Array(gids), 1));
        geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1));
        geo.instanceCount = count;

        const U = {
            uAtlas: { value: atlas.tex }, uGrid: { value: atlas.grid }, uTint: { value: 0.24 },
            uTime: { value: 0 }, uHover: { value: 0 }, uRadius: { value: 2.3 }, uStrength: { value: 1.6 },
            uIntro: { value: X3.reduced ? 1 : 0 }, uBurst: { value: 0 }, uBurstC: { value: new THREE.Vector2() },
            uMouse: { value: new THREE.Vector3(99, 99, 0) }, uGlitchY: { value: 99 }, uGlitchH: { value: 0 }, uGlitchAmt: { value: 0 },
            uScanY: { value: 99 }
        };
        const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        portrait.add(mesh);

        /* ---------- HUD ring around the portrait (gold ticks, red scanner arc) ---------- */
        const R = W / 2 + 0.55;
        const hud = new THREE.Group();
        const ticks = [];
        for (let i = 0; i < 120; i++) {
            const a = (i / 120) * Math.PI * 2, l = i % 10 === 0 ? 0.42 : 0.16;
            ticks.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(a) * (R + l), Math.sin(a) * (R + l), 0);
        }
        const tg = new THREE.BufferGeometry();
        tg.setAttribute('position', new THREE.Float32BufferAttribute(ticks, 3));
        hud.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xe7b75f, transparent: true, opacity: 0.45 })));
        hud.add(X3.circle(R - 0.12, 180, new THREE.LineBasicMaterial({ color: 0xe7b75f, transparent: true, opacity: 0.22 })));
        const arcPts = [];
        for (let i = 0; i <= 48; i++) {
            const a = (i / 48) * Math.PI * 0.55;
            arcPts.push(new THREE.Vector3(Math.cos(a) * (R + 0.7), Math.sin(a) * (R + 0.7), 0));
        }
        const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), new THREE.LineBasicMaterial({ color: 0xff3b55, transparent: true, opacity: 0.9 }));
        hud.add(arc);
        const arcTip = X3.glow(0xff3b55, 0.9, 0.9);
        arcTip.position.set(Math.cos(Math.PI * 0.55) * (R + 0.7), Math.sin(Math.PI * 0.55) * (R + 0.7), 0);
        arc.add(arcTip);
        const arc2 = arc.clone();
        arc2.material = new THREE.LineBasicMaterial({ color: 0x3dff8f, transparent: true, opacity: 0.55 });
        arc2.rotation.z = Math.PI;
        arc2.scale.setScalar(0.965);
        hud.add(arc2);
        hud.position.z = -0.6;
        portrait.add(hud);

        /* faint data dust */
        const N = X3.small() ? 400 : 900;
        const dpos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            dpos[i * 3] = (Math.random() - 0.5) * 60;
            dpos[i * 3 + 1] = (Math.random() - 0.5) * 36;
            dpos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 6;
        }
        const dg = new THREE.BufferGeometry();
        dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
        const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x3dff8f, size: 0.08, map: X3.glowTexture(), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
        scene.add(dust);

        /* ---------- pointer → portrait-local coordinates ---------- */
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const plane = new THREE.Plane();
        const hit = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const mouseLocal = new THREE.Vector3(99, 99, 0);
        const ptr = { x: 0, y: 0, inside: false, lastX: 0, lastY: 0, speed: 0 };
        const toLocal = () => {
            ndc.set(ptr.x, ptr.y);
            ray.setFromCamera(ndc, camera);
            portrait.updateMatrixWorld();
            normal.set(0, 0, 1).applyQuaternion(portrait.getWorldQuaternion(new THREE.Quaternion()));
            plane.setFromNormalAndCoplanarPoint(normal, portrait.getWorldPosition(new THREE.Vector3()));
            if (!ray.ray.intersectPlane(plane, hit)) return false;
            portrait.worldToLocal(mouseLocal.copy(hit));
            return true;
        };
        const setPtr = (e) => {
            const r = container.getBoundingClientRect();
            ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
            ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
            ptr.inside = true;
            const sp = Math.hypot(e.clientX - ptr.lastX, e.clientY - ptr.lastY);
            ptr.speed = Math.min(1, ptr.speed * 0.6 + sp / 60);
            ptr.lastX = e.clientX;
            ptr.lastY = e.clientY;
        };
        container.addEventListener('pointermove', setPtr);
        container.addEventListener('pointerleave', () => { ptr.inside = false; });
        let burst = 0;
        container.addEventListener('pointerdown', (e) => {
            setPtr(e);
            if (toLocal() && Math.hypot(mouseLocal.x, mouseLocal.y) < W / 2 + 0.5) {
                U.uBurstC.value.set(mouseLocal.x, mouseLocal.y);
                burst = 1;
            }
        });

        /* ---------- layout ---------- */
        let narrow = false;
        const layout = () => {
            const w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            renderer.setPixelRatio(X3.dpr());
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            const halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.position.z;
            const halfW = halfH * camera.aspect;
            narrow = w <= 720 || window.innerWidth <= window.innerHeight;
            if (!narrow) {
                const s = Math.min(0.98, (halfW * 0.86) / (W / 2 + 1.4), (halfH * 0.84) / (W / 2 + 1.0));
                rig.scale.setScalar(s);
                rig.position.set(halfW - (W / 2 + 1.1) * s - halfW * 0.02, -0.15, 0);
            } else {
                /* phones: the hero reserves a square zone under the nav (see .hero padding-top in CSS) */
                const zone = Math.min(window.innerWidth * 0.86, window.innerHeight * 0.42, 520);
                const navH = 64;
                const pxPerUnit = h / (2 * halfH);
                const s = Math.min(zone * 0.5, w * 0.47) / ((W / 2 + 1.25) * pxPerUnit);
                rig.scale.setScalar(s);
                rig.position.set(0, halfH - (navH + 6 + zone / 2) / pxPerUnit, 0);
            }
        };
        layout();
        if ('ResizeObserver' in window) new ResizeObserver(layout).observe(container);
        else window.addEventListener('resize', layout);

        /* ---------- loop ---------- */
        const vis = X3.watch(container);
        /* the fly-in runs on wall-clock time so slow devices finish it just as fast */
        let introT0 = (window.__pkgBooted || X3.reduced) ? performance.now() : 0;
        window.addEventListener('pkg:booted', () => { if (!introT0) introT0 = performance.now(); });
        let glitchNext = 2.5, glitchLeft = 0;
        let last = performance.now();
        let lastReadout = 0;
        let rotX = 0, rotY = 0;
        const loop = (now) => {
            requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!vis.visible || document.hidden) return;
            const t = now / 1000;
            U.uTime.value = t;

            if (introT0 && U.uIntro.value < 1) U.uIntro.value = Math.min(1, (now - introT0) / 2600);

            /* hover scatter */
            let over = false;
            if (ptr.inside && toLocal()) over = Math.hypot(mouseLocal.x, mouseLocal.y) < W / 2 + 1.2;
            const targetHover = over ? 1 : 0;
            U.uHover.value += (targetHover - U.uHover.value) * Math.min(1, dt * (over ? 7 : 3));
            if (over) U.uMouse.value.lerp(mouseLocal, Math.min(1, dt * 16));
            ptr.speed *= Math.pow(0.05, dt);
            U.uStrength.value = 1.3 + ptr.speed * 1.8;
            U.uRadius.value = 2.1 + ptr.speed * 0.9;

            /* click burst decays */
            if (burst > 0) {
                burst = Math.max(0, burst - dt * 0.8);
                U.uBurst.value = Math.sin(Math.min(1, (1 - burst) * 3) * Math.PI * 0.5) * burst;
            } else U.uBurst.value = 0;

            /* red scan line and glitch bands */
            if (!X3.reduced) {
                const cycle = (t % 6) / 6;
                U.uScanY.value = cycle < 0.55 ? H / 2 + 0.6 - (cycle / 0.55) * (H + 1.2) : 99;
                glitchNext -= dt;
                if (glitchNext <= 0) {
                    glitchLeft = 0.08 + Math.random() * 0.16;
                    glitchNext = 2.2 + Math.random() * 3.5;
                    U.uGlitchY.value = (Math.random() - 0.5) * H * 0.85;
                    U.uGlitchH.value = 0.12 + Math.random() * 0.45;
                    U.uGlitchAmt.value = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.8);
                }
                if (glitchLeft > 0) {
                    glitchLeft -= dt;
                    if (glitchLeft <= 0) U.uGlitchH.value = 0;
                }
            }

            /* parallax tilt shows the relief; gentle idle sway */
            const tx = ptr.inside ? -ptr.y * 0.22 : Math.sin(t * 0.35) * 0.05;
            const ty = ptr.inside ? ptr.x * 0.32 : Math.sin(t * 0.27) * 0.12;
            rotX += (tx - rotX) * Math.min(1, dt * 3);
            rotY += (ty - rotY) * Math.min(1, dt * 3);
            portrait.rotation.set(rotX, rotY, 0);
            arc.rotation.z += dt * 0.9;
            arc2.rotation.z -= dt * 0.5;
            dust.rotation.y += dt * 0.01;

            const scrollP = Math.min(1, window.scrollY / (container.clientHeight || 1));
            renderer.domElement.style.opacity = String(1 - scrollP * 0.75);
            portrait.position.y = scrollP * 2.2;

            if (readout && now - lastReadout > 140) {
                lastReadout = now;
                readout.textContent = over
                    ? 'x ' + (mouseLocal.x >= 0 ? '+' : '') + mouseLocal.x.toFixed(2) + ' · y ' + (mouseLocal.y >= 0 ? '+' : '') + mouseLocal.y.toFixed(2)
                    : count + ' glyphs · ' + P.cols + '×' + P.rows;
            }
            renderer.render(scene, camera);
        };
        requestAnimationFrame(loop);
    };
})();
