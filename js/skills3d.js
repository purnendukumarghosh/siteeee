/* Skill constellation: skills as stars on a draggable sphere, grouped by school. */
(function () {
    'use strict';

    window.initSkills = function () {
        const P = window.PROFILE;
        const stage = document.getElementById('skills-stage');
        const wrap = document.getElementById('skills-canvas');
        const labelLayer = document.getElementById('skills-labels');
        const card = document.getElementById('skill-card');
        const el = (id) => document.getElementById(id);
        const catById = {};
        P.skillCats.forEach((c, i) => { catById[c.id] = Object.assign({ index: i }, c); });

        const skills = P.skills.map((s) => Object.assign({ links: [] }, s));
        const byId = {};
        skills.forEach((s) => { byId[s.id] = s; });

        /* Edges: neighbours inside a school + explicit cross links */
        const edges = [];
        const seen = new Set();
        const link = (a, b) => {
            if (!byId[a] || !byId[b] || a === b) return;
            const key = a < b ? a + '|' + b : b + '|' + a;
            if (seen.has(key)) return;
            seen.add(key);
            edges.push({ a: byId[a], b: byId[b] });
            byId[a].links.push(byId[b]);
            byId[b].links.push(byId[a]);
        };
        P.skillCats.forEach((c) => {
            const list = skills.filter((s) => s.cat === c.id);
            for (let i = 0; i < list.length - 1; i++) link(list[i].id, list[i + 1].id);
        });
        (P.skillLinks || []).forEach((p) => link(p[0], p[1]));

        /* Place each school in its own sector of the sphere */
        const R = 3;
        P.skillCats.forEach((c, ci) => {
            const list = skills.filter((s) => s.cat === c.id);
            const n = list.length;
            const baseLon = (ci / P.skillCats.length) * Math.PI * 2;
            list.forEach((s, j) => {
                s.lat = (j - (n - 1) / 2) * 0.46;
                s.lon = baseLon + (n > 2 ? (j % 2 ? 0.3 : -0.3) : 0);
            });
        });

        /* ---------- DOM: filters, index, info card ---------- */
        let filter = null;
        let hovered = null;
        let selected = null;

        const filtersEl = el('skills-filters');
        const mkFilter = (id, name, color) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter';
            b.style.setProperty('--c', color);
            b.setAttribute('aria-pressed', id === null ? 'true' : 'false');
            b.innerHTML = '<i></i>' + name;
            b.addEventListener('click', () => {
                filter = id;
                filtersEl.querySelectorAll('.filter').forEach((f) => f.setAttribute('aria-pressed', 'false'));
                b.setAttribute('aria-pressed', 'true');
                if (selected && filter && selected.cat !== filter) select(null);
                if (filter && ctl) ctl.lookAt(0.15, -(catById[filter].index / P.skillCats.length) * Math.PI * 2);
                refreshDom();
            });
            filtersEl.appendChild(b);
        };
        mkFilter(null, 'All schools', '#d9f7e6');
        P.skillCats.forEach((c) => mkFilter(c.id, c.name, c.color));

        const indexEl = el('skills-index');
        P.skillCats.forEach((c) => {
            const col = document.createElement('div');
            col.style.setProperty('--c', c.color);
            col.innerHTML = '<h4>' + c.name + '</h4>';
            const ul = document.createElement('ul');
            skills.filter((s) => s.cat === c.id).forEach((s) => {
                const li = document.createElement('li');
                const b = document.createElement('button');
                b.type = 'button';
                b.innerHTML = '<span class="rune">' + s.rune + '</span>' + s.name;
                b.addEventListener('click', () => {
                    select(s);
                    const r = stage.getBoundingClientRect();
                    if (r.top < 0 || r.bottom > window.innerHeight) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                s.indexBtn = b;
                li.appendChild(b);
                ul.appendChild(li);
            });
            col.appendChild(ul);
            indexEl.appendChild(col);
        });

        const defaultCard = {
            rune: 'ᛟ', cat: 'CONSTELLATION', name: skills.length + ' stars · ' + P.skillCats.length + ' schools',
            title: 'Hover a star to read its lore.',
            lore: 'Each skill sits in its school’s region of the sky. Lines join technologies I use together.'
        };
        const showCard = (s) => {
            const c = s ? catById[s.cat] : null;
            card.classList.toggle('has-skill', !!s);
            card.style.setProperty('--c', c ? c.color : '');
            el('sk-rune').textContent = s ? s.rune : defaultCard.rune;
            el('sk-cat').textContent = s ? c.name : defaultCard.cat;
            el('sk-name').textContent = s ? s.name : defaultCard.name;
            el('sk-title').textContent = s ? s.title : defaultCard.title;
            el('sk-lore').textContent = s ? s.lore : defaultCard.lore;
            const links = el('sk-links');
            links.innerHTML = '';
            if (s) {
                s.links.forEach((n) => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.textContent = '↳ ' + n.name;
                    b.addEventListener('click', () => select(n));
                    links.appendChild(b);
                });
            }
        };

        /* ---------- Labels ---------- */
        skills.forEach((s) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'skill-label';
            b.style.setProperty('--c', catById[s.cat].color);
            b.textContent = s.name;
            b.setAttribute('aria-label', s.name + ' — ' + s.title);
            b.addEventListener('pointerenter', () => { hovered = s; refreshDom(); });
            b.addEventListener('pointerleave', () => { if (hovered === s) { hovered = null; refreshDom(); } });
            b.addEventListener('click', () => select(selected === s ? null : s));
            b.addEventListener('focus', () => { hovered = s; refreshDom(); });
            b.addEventListener('blur', () => { if (hovered === s) { hovered = null; refreshDom(); } });
            s.label = b;
            labelLayer.appendChild(b);
        });

        function active() { return hovered || selected; }
        function refreshDom() {
            const a = active();
            showCard(a);
            skills.forEach((s) => {
                const on = s === a;
                s.label.classList.toggle('is-active', on);
                if (s.indexBtn) s.indexBtn.classList.toggle('on', s === selected);
            });
        }

        let ctl = null;
        function select(s) {
            selected = s;
            if (s && filter && s.cat !== filter) {
                filter = null;
                filtersEl.querySelectorAll('.filter').forEach((f, i) => f.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'));
            }
            if (s && ctl) ctl.lookAt(s.lat, -s.lon);
            refreshDom();
        }
        showCard(null);

        if (!window.X3 || !X3.ok) {
            stage.classList.add('no-webgl');
            labelLayer.style.display = 'none';
            const msg = document.createElement('div');
            msg.className = 'myth-fallback';
            msg.textContent = '3D view unavailable on this device — use the skill index below.';
            wrap.appendChild(msg);
            return { select: (id) => select(byId[id] || null) };
        }

        /* ---------- Three.js scene ---------- */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(X3.dpr());
        renderer.setClearColor(0x000000, 0);
        wrap.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(0, 0, 10.5);

        const globe = new THREE.Group();
        scene.add(globe);

        globe.add(X3.wireGlobe(R * 0.985, 9, 9, new THREE.LineBasicMaterial({ color: 0x3dff8f, transparent: true, opacity: 0.07 })));
        const equator = X3.circle(R * 1.0, 128, new THREE.LineBasicMaterial({ color: 0xe7b75f, transparent: true, opacity: 0.25 }), 'y');
        globe.add(equator);

        const coreGroup = new THREE.Group();
        coreGroup.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.45, 0)),
            new THREE.LineBasicMaterial({ color: 0xe7b75f, transparent: true, opacity: 0.8 })
        ));
        coreGroup.add(X3.glow(0x3dff8f, 3.2, 0.25));
        globe.add(coreGroup);

        /* Outer gimbal ring */
        const gimbal = new THREE.Group();
        gimbal.add(X3.circle(R * 1.32, 160, new THREE.LineBasicMaterial({ color: 0xe7b75f, transparent: true, opacity: 0.22 })));
        const gt = [];
        for (let i = 0; i < 72; i++) {
            const a = (i / 72) * Math.PI * 2, l = i % 6 === 0 ? 0.16 : 0.06, r = R * 1.32;
            gt.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(a) * (r + l), Math.sin(a) * (r + l), 0);
        }
        const gtg = new THREE.BufferGeometry();
        gtg.setAttribute('position', new THREE.Float32BufferAttribute(gt, 3));
        gimbal.add(new THREE.LineSegments(gtg, new THREE.LineBasicMaterial({ color: 0xe7b75f, transparent: true, opacity: 0.3 })));
        gimbal.rotation.x = 1.15;
        scene.add(gimbal);

        /* Stars */
        const sp = (lat, lon, r) => new THREE.Vector3(r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon));
        const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
        skills.forEach((s) => {
            const color = new THREE.Color(catById[s.cat].color);
            s.color = color;
            s.pos = sp(s.lat, s.lon, R);
            const size = 0.07 + Math.min(5, s.links.length) * 0.012;
            const node = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: color, transparent: true }));
            node.scale.setScalar(size);
            node.position.copy(s.pos);
            const g = X3.glow(color, 0.75, 0.7);
            g.position.copy(s.pos);
            s.node = node;
            s.glow = g;
            s.baseSize = size;
            s.curScale = 1;
            globe.add(node, g);
        });

        /* Arcs */
        edges.forEach((e) => {
            const mid = e.a.pos.clone().add(e.b.pos).multiplyScalar(0.5);
            const chord = e.a.pos.distanceTo(e.b.pos);
            if (mid.length() < 0.01) mid.set(0, 1, 0);
            mid.normalize().multiplyScalar(R * (1 + chord * 0.07));
            e.curve = new THREE.QuadraticBezierCurve3(e.a.pos, mid, e.b.pos);
            const pts = e.curve.getPoints(36);
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const cols = [];
            pts.forEach((p, i) => {
                const c = e.a.color.clone().lerp(e.b.color, i / (pts.length - 1));
                cols.push(c.r, c.g, c.b);
            });
            geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
            e.line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false }));
            globe.add(e.line);
        });

        /* Pulses travelling along arcs */
        const pulses = [];
        for (let i = 0; i < (X3.small() ? 8 : 14); i++) {
            const s = X3.glow(0xffffff, 0.32, 0.9);
            globe.add(s);
            pulses.push({ s: s, e: edges[(Math.random() * edges.length) | 0], t: Math.random(), v: 0.25 + Math.random() * 0.35 });
        }

        /* Background star dust */
        const dustN = 600;
        const dp = new Float32Array(dustN * 3);
        for (let i = 0; i < dustN; i++) {
            const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(7 + Math.random() * 10);
            dp.set([v.x, v.y, v.z], i * 3);
        }
        const dg = new THREE.BufferGeometry();
        dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
        const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x3dff8f, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false }));
        scene.add(dust);

        /* Controls */
        ctl = new X3.DragRotate(wrap, { auto: 0.09, tilt: 0.12, minX: -1.2, maxX: 1.2, startX: 0.25, startY: 0.4 });
        const nearest = (px, py) => {
            let best = null, bd = 30;
            skills.forEach((s) => {
                if (!s.front) return;
                const d = Math.hypot(s.sx - px, s.sy - py);
                if (d < bd) { bd = d; best = s; }
            });
            return best;
        };
        ctl.onTap = () => {
            const s = nearest(ctl.px, ctl.py);
            select(s && s === selected ? null : s);
        };
        let canvasHover = null;
        wrap.addEventListener('pointermove', () => {
            if (ctl.dragging) return;
            const s = nearest(ctl.px, ctl.py);
            if (s !== canvasHover) {
                canvasHover = s;
                hovered = s;
                wrap.style.cursor = s ? 'pointer' : '';
                refreshDom();
            }
        });
        wrap.addEventListener('pointerleave', () => {
            if (canvasHover) { canvasHover = null; hovered = null; refreshDom(); }
        });

        let W = 1, H = 1;
        const layout = () => {
            W = wrap.clientWidth;
            H = wrap.clientHeight;
            if (!W || !H) return;
            renderer.setSize(W, H, false);
            camera.aspect = W / H;
            const narrow = W < 720;
            camera.position.z = narrow ? 12.5 : 10.5;
            camera.position.y = narrow ? -1.1 : 0;
            globe.position.x = narrow ? 0 : -1.2;
            gimbal.position.x = globe.position.x;
            camera.updateProjectionMatrix();
        };
        layout();
        if ('ResizeObserver' in window) new ResizeObserver(layout).observe(wrap);
        else window.addEventListener('resize', layout);

        const vis = X3.watch(stage);
        const v = new THREE.Vector3();
        const centerW = new THREE.Vector3();
        let last = performance.now();
        const loop = (now) => {
            requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!vis.visible || document.hidden) return;

            ctl.update(dt);
            globe.rotation.x = ctl.x;
            globe.rotation.y = ctl.y;
            gimbal.rotation.z += dt * 0.05;
            coreGroup.rotation.y += dt * 0.5;
            coreGroup.rotation.x += dt * 0.2;
            dust.rotation.y += dt * 0.01;
            globe.updateMatrixWorld();
            centerW.setFromMatrixPosition(globe.matrixWorld);

            const a = active();
            const neighbours = a ? new Set(a.links) : null;

            skills.forEach((s) => {
                const dim = filter && s.cat !== filter;
                let target = 1;
                if (a === s) target = 2;
                else if (neighbours && neighbours.has(s)) target = 1.35;
                s.curScale += (target - s.curScale) * Math.min(1, dt * 10);
                s.node.scale.setScalar(s.baseSize * s.curScale);
                s.glow.scale.setScalar(0.75 * s.curScale);
                const op = dim ? 0.12 : a && a !== s && !neighbours.has(s) ? 0.45 : 1;
                s.node.material.opacity = op;
                s.glow.material.opacity = 0.7 * op;

                v.copy(s.pos).applyMatrix4(globe.matrixWorld);
                const depth = (v.z - centerW.z) / R;
                v.project(camera);
                s.sx = (v.x * 0.5 + 0.5) * W;
                s.sy = (-v.y * 0.5 + 0.5) * H;
                s.front = depth > -0.25 && !dim;
                const lo = dim ? 0.06 : Math.max(0.12, Math.min(1, 0.55 + depth * 0.6));
                const sc = 0.82 + Math.max(0, depth) * 0.22;
                s.label.style.transform = 'translate3d(' + s.sx.toFixed(1) + 'px,' + s.sy.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
                s.label.style.opacity = a === s ? 1 : lo.toFixed(2);
                s.label.style.zIndex = String(Math.round((depth + 1) * 100));
                s.label.classList.toggle('is-back', !s.front);
                s.label.tabIndex = dim ? -1 : 0;
            });

            edges.forEach((e) => {
                const dim = filter && (e.a.cat !== filter || e.b.cat !== filter);
                const hot = a && (e.a === a || e.b === a);
                const target = dim ? 0.04 : hot ? 0.95 : a ? 0.1 : 0.3;
                e.line.material.opacity += (target - e.line.material.opacity) * Math.min(1, dt * 8);
            });

            pulses.forEach((p) => {
                p.t += dt * p.v;
                if (p.t >= 1) {
                    p.t = 0;
                    const pool = a ? edges.filter((e) => e.a === a || e.b === a) : edges;
                    p.e = pool[(Math.random() * pool.length) | 0] || edges[0];
                    p.rev = a ? p.e.b === a : Math.random() < 0.5;
                }
                p.e.curve.getPoint(p.rev ? 1 - p.t : p.t, p.s.position);
                const dim = filter && (p.e.a.cat !== filter || p.e.b.cat !== filter);
                p.s.material.opacity = dim ? 0 : Math.sin(p.t * Math.PI) * 0.9;
            });

            renderer.render(scene, camera);
        };
        requestAnimationFrame(loop);

        return { select: (id) => select(byId[id] || null), skills: skills };
    };
})();
