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

    window.X3 = X3;
})();
