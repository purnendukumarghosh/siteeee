/* Shared helpers for the Three.js scenes. */
(function () {
    'use strict';

    const X3 = {};
    const mq = (q) => window.matchMedia && window.matchMedia(q).matches;

    X3.reduced = mq('(prefers-reduced-motion: reduce)');
    X3.coarse = mq('(hover: none), (pointer: coarse)');
    X3.small = () => window.innerWidth < 720;
    X3.dpr = () => Math.min(window.devicePixelRatio || 1, X3.small() ? 1.5 : 1.75);

    X3.ok = (function () {
        if (!window.THREE) return false;
        try {
            const c = document.createElement('canvas');
            return !!(c.getContext('webgl2') || c.getContext('webgl'));
        } catch (e) {
            return false;
        }
    })();

    /* Soft radial sprite used for glows and particles. */
    let glowTex = null;
    X3.glowTexture = function () {
        if (glowTex) return glowTex;
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(0.18, 'rgba(255,255,255,0.75)');
        grd.addColorStop(0.45, 'rgba(255,255,255,0.18)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
        glowTex = new THREE.CanvasTexture(c);
        return glowTex;
    };

    X3.glow = function (color, scale, opacity) {
        const m = new THREE.SpriteMaterial({
            map: X3.glowTexture(), color: color, transparent: true,
            opacity: opacity == null ? 0.6 : opacity, depthWrite: false, blending: THREE.AdditiveBlending
        });
        const s = new THREE.Sprite(m);
        s.scale.setScalar(scale || 1);
        return s;
    };

    /* Camera-facing text label drawn to a canvas texture. */
    X3.textSprite = function (text, opts) {
        opts = Object.assign({ color: '#d9f7e6', size: 48, font: 'JetBrains Mono, monospace', weight: 500, height: 0.32, bg: null, pad: 14 }, opts || {});
        const c = document.createElement('canvas');
        const g = c.getContext('2d');
        const fontStr = opts.weight + ' ' + opts.size + 'px ' + opts.font;
        g.font = fontStr;
        const w = Math.ceil(g.measureText(text).width) + opts.pad * 2;
        const h = Math.ceil(opts.size * 1.5);
        c.width = w;
        c.height = h;
        g.font = fontStr;
        if (opts.bg) {
            g.fillStyle = opts.bg;
            g.fillRect(0, 0, w, h);
        }
        g.fillStyle = opts.color;
        g.textBaseline = 'middle';
        g.fillText(text, opts.pad, h / 2 + 2);
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: opts.depthTest !== false });
        const s = new THREE.Sprite(mat);
        s.scale.set(opts.height * (w / h), opts.height, 1);
        return s;
    };

    /* Circle polyline helper (for orbits, latitude rings, etc). */
    X3.circle = function (radius, segments, material, axis) {
        const pts = [];
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            if (axis === 'y') pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
            else pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
        }
        return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
    };

    /* Lat/long wire globe (cleaner than WireframeGeometry). */
    X3.wireGlobe = function (radius, lats, longs, material) {
        const group = new THREE.Group();
        for (let i = 1; i < lats; i++) {
            const phi = (i / lats) * Math.PI;
            const r = Math.sin(phi) * radius;
            const ring = X3.circle(r, 72, material, 'y');
            ring.position.y = Math.cos(phi) * radius;
            group.add(ring);
        }
        for (let j = 0; j < longs; j++) {
            const ring = X3.circle(radius, 72, material);
            ring.rotation.y = (j / longs) * Math.PI;
            group.add(ring);
        }
        return group;
    };

    /* Pause/resume work when an element scrolls out of view. */
    X3.watch = function (el, onChange) {
        const state = { visible: false };
        if (!('IntersectionObserver' in window)) {
            state.visible = true;
            if (onChange) onChange(true);
            return state;
        }
        new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                state.visible = e.isIntersecting;
                if (onChange) onChange(e.isIntersecting);
            });
        }, { rootMargin: '120px 0px' }).observe(el);
        return state;
    };

    /* Drag-to-rotate with inertia + gentle tilt toward the hovering cursor.
       Works with mouse, pen and touch (horizontal drags; vertical swipes still scroll). */
    X3.DragRotate = class {
        constructor(el, opts) {
            this.el = el;
            this.o = Object.assign({ auto: 0.12, tilt: 0.25, minX: -1.1, maxX: 1.1, speed: 0.006 }, opts || {});
            this.rx = this.o.startX || 0;
            this.ry = this.o.startY || 0;
            this.vx = 0;
            this.vy = 0;
            this.tx = 0;
            this.ty = 0;
            this.ptx = 0;
            this.pty = 0;
            this.dragging = false;
            this.hover = false;
            this.ndc = { x: 0, y: 0 };
            this.focus = null;
            this.idle = 0;
            this.onTap = null;
            this.onDrag = null;
            this._down = null;

            el.addEventListener('pointerdown', (e) => this._pd(e));
            el.addEventListener('pointermove', (e) => this._pm(e));
            el.addEventListener('pointerup', (e) => this._pu(e));
            el.addEventListener('pointercancel', () => { this.dragging = false; this._down = null; });
            el.addEventListener('pointerleave', () => { this.hover = false; this.ptx = 0; this.pty = 0; });
            el.addEventListener('pointerenter', () => { this.hover = true; });
        }
        _xy(e) {
            const r = this.el.getBoundingClientRect();
            this.ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
            this.ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
            this.px = e.clientX - r.left;
            this.py = e.clientY - r.top;
        }
        _pd(e) {
            if (e.button !== undefined && e.button !== 0) return;
            this._xy(e);
            this._down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, id: e.pointerId };
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        }
        _pm(e) {
            this._xy(e);
            this.hover = true;
            this.ptx = this.ndc.y * this.o.tilt;
            this.pty = this.ndc.x * this.o.tilt;
            if (!this._down) return;
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            if (!this._down.moved && Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y) > 5) {
                this._down.moved = true;
                this.dragging = true;
                this.focus = null;
                try { this.el.setPointerCapture(this._down.id); } catch (err) { /* ignore */ }
            }
            if (this.dragging) {
                this.vy = dx * this.o.speed;
                this.vx = dy * this.o.speed;
                this.ry += this.vy;
                this.rx = Math.max(this.o.minX, Math.min(this.o.maxX, this.rx + this.vx));
                this.idle = 0;
                if (this.onDrag) this.onDrag(dx, dy);
            }
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        }
        _pu(e) {
            if (this._down && !this._down.moved && this.onTap) {
                this._xy(e);
                this.onTap(this.ndc, e);
            }
            this.dragging = false;
            this._down = null;
            try { this.el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        /* Smoothly rotate to a given orientation. */
        lookAt(rx, ry) {
            const twoPi = Math.PI * 2;
            let d = (ry - this.ry) % twoPi;
            if (d > Math.PI) d -= twoPi;
            if (d < -Math.PI) d += twoPi;
            this.focus = { rx: Math.max(this.o.minX, Math.min(this.o.maxX, rx)), ry: this.ry + d };
            this.vx = this.vy = 0;
        }
        update(dt) {
            this.idle += dt;
            if (this.focus) {
                const k = 1 - Math.pow(0.002, dt);
                this.rx += (this.focus.rx - this.rx) * k;
                this.ry += (this.focus.ry - this.ry) * k;
                if (Math.abs(this.focus.ry - this.ry) < 0.001 && Math.abs(this.focus.rx - this.rx) < 0.001) this.focus = null;
            } else if (!this.dragging) {
                this.ry += this.vy;
                this.rx = Math.max(this.o.minX, Math.min(this.o.maxX, this.rx + this.vx));
                this.vx *= 0.93;
                this.vy *= 0.93;
                if (this.idle > 1.5 && !X3.reduced) this.ry += this.o.auto * dt;
            }
            const k2 = 1 - Math.pow(0.02, dt);
            this.tx += ((this.hover && !this.dragging ? -this.ptx : 0) - this.tx) * k2;
            this.ty += ((this.hover && !this.dragging ? this.pty : 0) - this.ty) * k2;
        }
        get x() { return this.rx + this.tx; }
        get y() { return this.ry + this.ty; }
    };

    window.X3 = X3;
})();
