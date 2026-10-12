/* Visual effects: boot intro, cursor, text decrypt, reveals, nav, ticker, sigils. */
(function () {
    'use strict';

    const FX = {};
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const GLYPHS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟアイウエオカキクケコサシスセソ0123456789ABCDEF<>/{}[]#$%&*+=';
    FX.reduced = reduced;

    /* ---------- storage (may be unavailable) ---------- */
    const store = {
        get(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    };

    /* ---------- toast ---------- */
    let toastTimer = null;
    FX.toast = function (msg, ms) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2600);
    };

    /* ---------- text scramble / decrypt ---------- */
    FX.scramble = function (el, finalText, duration) {
        const text = finalText != null ? finalText : (el.getAttribute('data-final') || el.textContent);
        if (reduced) {
            el.textContent = text;
            return Promise.resolve();
        }
        const dur = duration || Math.min(1400, 300 + text.length * 28);
        const start = performance.now();
        const chars = text.split('');
        const order = chars.map((c, i) => i / chars.length * 0.7 + Math.random() * 0.3);
        el.setAttribute('aria-label', text);
        return new Promise((resolve) => {
            const step = (now) => {
                const p = Math.min(1, (now - start) / dur);
                let s = '';
                if (window.__pkgPrinting) {
                    el.textContent = text;
                    return resolve();
                }
                for (let i = 0; i < chars.length; i++) {
                    const c = chars[i];
                    if (c === ' ' || p >= order[i]) s += c;
                    else s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
                }
                el.textContent = s;
                if (p < 1) requestAnimationFrame(step);
                else {
                    el.textContent = text;
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    };

    /* ---------- reveal on scroll ---------- */
    FX.initReveal = function () {
        const items = document.querySelectorAll('.reveal');
        const scr = document.querySelectorAll('.section .scramble, .decrypt');
        if (!('IntersectionObserver' in window)) {
            items.forEach((el) => el.classList.add('in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                e.target.classList.add('in');
                io.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        items.forEach((el) => io.observe(el));

        const io2 = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const el = e.target;
                io2.unobserve(el);
                FX.scramble(el, el.getAttribute('data-final') || el.textContent, el.classList.contains('decrypt') ? 700 : null);
            });
        }, { threshold: 0.4 });
        scr.forEach((el) => {
            if (!el.getAttribute('data-final')) el.setAttribute('data-final', el.textContent);
            io2.observe(el);
        });
    };

    /* ---------- boot intro ---------- */
    FX.boot = function () {
        const boot = document.getElementById('boot');
        const done = () => {
            if (window.__pkgBooted) return;
            window.__pkgBooted = true;
            boot.classList.add('done');
            document.body.classList.remove('booting');
            store.set('pkg-booted', '1');
            window.dispatchEvent(new Event('pkg:booted'));
            document.querySelectorAll('.hero .scramble').forEach((el, i) => setTimeout(() => FX.scramble(el, el.getAttribute('data-final'), 1100), i * 180));
            setTimeout(() => boot.remove(), 900);
        };
        if (!boot) { done(); return; }
        if (reduced || store.get('pkg-booted')) {
            boot.style.transition = 'none';
            done();
            return;
        }
        document.body.classList.add('booting');
        const log = document.getElementById('boot-log');
        const bar = document.getElementById('boot-bar');
        const welcome = document.getElementById('boot-welcome');
        const lines = [
            ['PKG//OS BIOS 4.2 · Antikythera Labs', ''],
            ['bronze gear array ............ ', '<span class="ok">30 gears</span>'],
            ['saros cache .................. ', '<span class="ok">223 months</span>'],
            ['mounting /dev/runes .......... ', '<span class="ok">[ OK ]</span>'],
            ['loading codex-6.1 kernel ..... ', '<span class="ok">[ OK ]</span>'],
            ['calibrating astrolabe rings .. ', '<span class="ok">[ OK ]</span>'],
            ['starting pkg-sh .............. ', '<span class="ok">[ OK ]</span>'],
            ['', '<span class="au">ᚹᛖᛚᚲᛟᛗᛖ · all systems nominal</span>']
        ];
        let i = 0;
        const next = () => {
            if (window.__pkgBooted) return;
            if (i < lines.length) {
                log.innerHTML += lines[i][0] + lines[i][1] + '\n';
                bar.style.width = ((i + 1) / lines.length * 100) + '%';
                i++;
                setTimeout(next, 150 + Math.random() * 120);
            } else {
                welcome.classList.add('show');
                setTimeout(done, 900);
            }
        };
        setTimeout(next, 250);
        const skip = () => done();
        document.getElementById('boot-skip').addEventListener('click', skip);
        window.addEventListener('keydown', function k(e) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                skip();
                window.removeEventListener('keydown', k);
            }
        });
        boot.addEventListener('click', (e) => { if (e.target === boot) skip(); });
        setTimeout(done, 6000);
    };

    /* ---------- cursor ---------- */
    FX.initCursor = function () {
        if (!fine || reduced) return;
        const c = document.getElementById('cursor');
        if (!c) return;
        document.body.classList.add('has-cursor');
        const ring = c.querySelector('.cursor-ring');
        const dot = c.querySelector('.cursor-dot');
        const xy = document.getElementById('cursor-xy');
        const label = document.getElementById('cursor-label');
        let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
        let shown = false;
        window.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            mx = e.clientX;
            my = e.clientY;
            if (!shown) { shown = true; rx = mx; ry = my; c.classList.remove('is-hidden'); }
        }, { passive: true });
        document.addEventListener('mouseleave', () => { c.classList.add('is-hidden'); shown = false; });
        window.addEventListener('pointerdown', () => c.classList.add('is-down'));
        window.addEventListener('pointerup', () => c.classList.remove('is-down'));
        document.addEventListener('mouseover', (e) => {
            const t = e.target.closest('a, button, [data-cursor], input, textarea, label, summary');
            if (!t || t.matches('input[type="text"], textarea, .term-input')) {
                c.classList.remove('is-hover');
                return;
            }
            const big = t.matches('a, button') || (t.dataset.cursor && t.dataset.cursor !== 'type' && t.dataset.cursor !== 'drag' && t.dataset.cursor !== 'aim');
            c.classList.toggle('is-hover', !!big);
            label.textContent = t.dataset.cursor || (t.matches('a') ? 'open' : 'click');
            if (t.dataset.cursor === 'drag' || t.dataset.cursor === 'aim') {
                c.classList.remove('is-hover');
            }
        });
        const loop = () => {
            rx += (mx - rx) * 0.2;
            ry += (my - ry) * 0.2;
            ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
            dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
            xy.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
            xy.textContent = 'x:' + String(Math.round(mx)).padStart(4, '0') + ' y:' + String(Math.round(my)).padStart(4, '0');
            requestAnimationFrame(loop);
        };
        c.classList.add('is-hidden');
        requestAnimationFrame(loop);
    };

    /* ---------- nav ---------- */
    FX.initNav = function () {
        const burger = document.getElementById('nav-burger');
        const links = document.getElementById('nav-links');
        const setOpen = (open) => {
            links.classList.toggle('open', open);
            burger.setAttribute('aria-expanded', String(open));
        };
        burger.addEventListener('click', () => setOpen(!links.classList.contains('open')));
        links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

        const map = {};
        links.querySelectorAll('a').forEach((a) => { map[a.getAttribute('href').slice(1)] = a; });
        const navAs = Object.values(map);
        const setActive = (a) => {
            navAs.forEach((x) => x.classList.toggle('active', x === a));
        };
        /* at the very bottom the last section may never reach mid-screen, so it wins there */
        const atBottom = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            return max > 0 && window.scrollY >= max - 4;
        };
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                if (atBottom()) return setActive(navAs[navAs.length - 1]);
                entries.forEach((e) => {
                    const a = map[e.target.id];
                    if (a && e.isIntersecting) setActive(a);
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            Object.keys(map).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
        }

        const prog = document.getElementById('progress');
        const onScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            prog.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
            if (atBottom() && navAs.length) setActive(navAs[navAs.length - 1]);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    };

    /* ---------- clock, uptime, meters ---------- */
    FX.initClock = function () {
        const clock = document.getElementById('nav-clock');
        const up = document.getElementById('sys-uptime');
        const time = document.getElementById('sys-time');
        const t0 = Date.now();
        const meters = ['m-cpu', 'm-mem', 'm-net'].map((id) => document.getElementById(id));
        const vals = [32, 48, 20];
        const pad = (n) => String(n).padStart(2, '0');
        const tick = () => {
            const d = new Date();
            const hms = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
            if (clock) clock.textContent = hms;
            if (time) time.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
            const s = Math.floor((Date.now() - t0) / 1000);
            if (up) up.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
            meters.forEach((m, i) => {
                if (!m) return;
                vals[i] = Math.max(8, Math.min(92, vals[i] + (Math.random() - 0.5) * 24));
                m.style.width = vals[i] + '%';
            });
        };
        tick();
        setInterval(tick, 1000);
    };

    /* ---------- motto: one phrase, a new skin + entrance every ~2.6s ---------- */
    FX.motto = function (el, text) {
        if (!el) return;
        const RUNE = { a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ', g: 'ᚷ', h: 'ᚺ', i: 'ᛁ', j: 'ᛃ', k: 'ᚲ', l: 'ᛚ', m: 'ᛗ', n: 'ᚾ', o: 'ᛟ', p: 'ᛈ', q: 'ᚲ', r: 'ᚱ', s: 'ᛊ', t: 'ᛏ', u: 'ᚢ', v: 'ᚹ', w: 'ᚹ', x: 'ᛉ', y: 'ᛃ', z: 'ᛉ' };
        /* curated pairs: skin (look) × entrance (motion) */
        const COMBOS = [
            ['term', 'decrypt'], ['ancient', 'runes'], ['redalert', 'glitch'], ['holo', 'rise'],
            ['ink', 'sweep'], ['outline', 'flip'], ['term', 'type'], ['neon', 'blur'],
            ['glitch', 'scatter'], ['ancient', 'wave'], ['redalert', 'binary'], ['ink', 'spotlight']
        ];
        el.setAttribute('aria-hidden', 'true');
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = text;
        el.parentNode.insertBefore(sr, el);

        const chars = text.split('');
        const build = () => {
            el.innerHTML = chars.map((c, i) =>
                '<span class="mc' + (c === ' ' ? ' sp' : '') + '" style="--i:' + i + ';--dx:' + ((Math.random() - 0.5) * 160).toFixed(0) + 'px;--dy:' + ((Math.random() - 0.5) * 70).toFixed(0) + 'px;--r:' + ((Math.random() - 0.5) * 140).toFixed(0) + 'deg">' + (c === ' ' ? '&nbsp;' : c) + '</span>'
            ).join('');
            return Array.prototype.slice.call(el.children);
        };
        let timers = [];
        const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
        const clear = () => { timers.forEach(clearTimeout); timers = []; };

        /* JS-driven entrances: they morph characters before settling */
        const morph = (spans, pick, dur, stagger) => {
            spans.forEach((s, i) => {
                const real = chars[i];
                if (real === ' ') return;
                const t0 = i * stagger;
                const ticks = Math.max(2, Math.round(dur / 55));
                for (let k = 0; k < ticks; k++) later(() => { s.textContent = pick(real, k / ticks); s.classList.add('morph'); }, t0 + k * 55);
                later(() => { s.textContent = real; s.classList.remove('morph'); s.classList.add('done'); }, t0 + ticks * 55);
            });
        };
        const GLY = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟアイウエオカキクケコ0123456789<>/{}#$%&*';
        const JS = {
            decrypt: (sp) => morph(sp, () => GLY[(Math.random() * GLY.length) | 0], 420, 22),
            runes: (sp) => morph(sp, (c) => RUNE[c] || c, 520, 30),
            binary: (sp) => morph(sp, () => (Math.random() < 0.5 ? '0' : '1'), 380, 20),
            type: (sp) => {
                sp.forEach((s) => s.classList.add('hide'));
                sp.forEach((s, i) => later(() => s.classList.remove('hide'), 120 + i * 32));
            }
        };

        let order = [], idx = 0, last = null;
        const shuffled = () => {
            /* Fisher–Yates, retried until no two neighbours share a skin (also across rounds) */
            for (let attempt = 0; attempt < 60; attempt++) {
                const a = COMBOS.slice();
                for (let i = a.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const t = a[i]; a[i] = a[j]; a[j] = t;
                }
                let ok = !last || a[0][0] !== last[0];
                for (let i = 1; ok && i < a.length; i++) if (a[i][0] === a[i - 1][0]) ok = false;
                if (ok) return a;
            }
            return COMBOS.slice();
        };
        const next = () => {
            if (idx >= order.length) {
                order = shuffled();
                idx = 0;
            }
            return order[idx++];
        };
        const show = () => {
            clear();
            const combo = next();
            last = combo;
            if (reduced) {
                el.className = 'motto skin-' + combo[0];
                if (!el.firstChild) build();
                return;
            }
            el.classList.add('out');
            later(() => {
                const spans = build();
                el.className = 'motto skin-' + combo[0] + ' anim-' + combo[1];
                void el.offsetWidth;
                el.classList.add('go');
                if (JS[combo[1]]) JS[combo[1]](spans);
            }, 160);
        };

        let running = false, loopT = null, lastShow = 0;
        const tick = () => { lastShow = performance.now(); show(); };
        const start = () => {
            if (running) return;
            running = true;
            /* observers can fire several times while the page settles: never restyle twice within a second */
            if (performance.now() - lastShow > 1000) tick();
            loopT = setInterval(tick, reduced ? 3200 : 2600);
        };
        const stop = () => {
            running = false;
            clearInterval(loopT);
        };
        el.className = 'motto skin-term';
        build();
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((en) => { en.forEach((e) => (e.isIntersecting ? start() : stop())); }).observe(el);
        } else start();
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    };

    /* ---------- ticker ---------- */
    FX.initTicker = function (el, facts) {
        if (!el) return;
        const html = facts.map((f) => {
            const m = f.match(/^([^—]+)—\s*(.*)$/);
            const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
            return '<span>' + (m ? '<b>' + esc(m[1].trim()) + '</b> — ' + esc(m[2]) : esc(f)) + '</span>';
        }).join('');
        el.innerHTML = html + html;
        el.querySelectorAll('span').forEach((s, i) => { if (i >= facts.length) s.setAttribute('aria-hidden', 'true'); });
    };

    /* ---------- tilt cards ---------- */
    FX.tilt = function (selector) {
        if (!fine) return;
        document.querySelectorAll(selector).forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
                el.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
                el.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
                el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
            });
            el.addEventListener('pointerleave', () => {
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
            });
        });
    };

    /* ---------- matrix rain ---------- */
    let rainOn = false, rainRaf = 0;
    FX.toggleMatrix = function () {
        const cv = document.getElementById('matrix');
        if (!cv) return false;
        rainOn = !rainOn;
        cv.classList.toggle('on', rainOn);
        if (!rainOn) { cancelAnimationFrame(rainRaf); return false; }
        const g = cv.getContext('2d');
        const fs = 16;
        const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);
        let drops = Array(Math.ceil(cv.width / fs)).fill(0).map(() => Math.random() * -50);
        let last = 0;
        const draw = (now) => {
            rainRaf = requestAnimationFrame(draw);
            if (now - last < 50) return;
            last = now;
            if (drops.length < Math.ceil(cv.width / fs)) drops = Array(Math.ceil(cv.width / fs)).fill(0);
            g.fillStyle = 'rgba(2, 4, 5, 0.12)';
            g.fillRect(0, 0, cv.width, cv.height);
            g.font = fs + 'px JetBrains Mono, monospace';
            drops.forEach((y, i) => {
                const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
                const rr = Math.random();
                g.fillStyle = rr < 0.04 ? '#ff3b55' : rr < 0.1 ? '#e7b75f' : '#3dff8f';
                g.fillText(ch, i * fs, y * fs);
                drops[i] = y * fs > cv.height && Math.random() > 0.975 ? 0 : y + 1;
            });
        };
        rainRaf = requestAnimationFrame(draw);
        return true;
    };

    /* ---------- konami ---------- */
    FX.initKonami = function () {
        const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let pos = 0;
        window.addEventListener('keydown', (e) => {
            const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
            if (pos === seq.length) {
                pos = 0;
                const on = FX.toggleMatrix();
                FX.toast(on ? 'ᛟ Ancient code accepted — the rain begins.' : 'Rain stopped.');
            }
        });
    };

    /* ---------- procedural sigil (seal) ---------- */
    FX.sigil = function (seedText, size, opts) {
        opts = opts || {};
        let h = 2166136261;
        for (let i = 0; i < seedText.length; i++) { h ^= seedText.charCodeAt(i); h = Math.imul(h, 16777619); }
        const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
        const c = size / 2;
        const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
        const ring = (r, w, col, op, dash) => '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" opacity="' + op + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
        let s = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
        s += '<defs><radialGradient id="sg' + size + '"><stop offset="0" stop-color="#3dff8f" stop-opacity=".18"/><stop offset="1" stop-color="#3dff8f" stop-opacity="0"/></radialGradient></defs>';
        s += '<circle cx="' + c + '" cy="' + c + '" r="' + c * 0.95 + '" fill="url(#sg' + size + ')"/>';
        s += ring(c * 0.94, 1.2, '#e7b75f', 0.9);
        s += ring(c * 0.86, 0.8, '#e7b75f', 0.5, '2 4');
        /* rotating rune band */
        s += '<g class="sigil-spin">';
        const n = 24;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = c + Math.cos(a) * c * 0.75, y = c + Math.sin(a) * c * 0.75;
            s += '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" fill="#e7b75f" font-family="Noto Sans Runic, Segoe UI Historic, sans-serif" font-size="' + (size * 0.055).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" transform="rotate(' + ((a * 180) / Math.PI + 90).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" opacity=".85">' + runes[(rnd() * runes.length) | 0] + '</text>';
        }
        if (!reduced) s += '<animateTransform attributeName="transform" type="rotate" from="0 ' + c + ' ' + c + '" to="360 ' + c + ' ' + c + '" dur="90s" repeatCount="indefinite"/>';
        s += '</g>';
        s += ring(c * 0.64, 1, '#3dff8f', 0.7);
        /* star polygon */
        const k = 5 + ((rnd() * 4) | 0), step = 2 + ((rnd() * 2) | 0);
        let pts = [];
        for (let i = 0; i < k; i++) {
            const a = ((i * step) / k) * Math.PI * 2 - Math.PI / 2;
            pts.push((c + Math.cos(a) * c * 0.6).toFixed(1) + ',' + (c + Math.sin(a) * c * 0.6).toFixed(1));
        }
        s += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#3dff8f" stroke-width="1" opacity=".6"/>';
        /* tick marks */
        for (let i = 0; i < 60; i++) {
            const a = (i / 60) * Math.PI * 2, r1 = c * 0.94, r2 = c * (i % 5 ? 0.9 : 0.87);
            s += '<line x1="' + (c + Math.cos(a) * r1).toFixed(1) + '" y1="' + (c + Math.sin(a) * r1).toFixed(1) + '" x2="' + (c + Math.cos(a) * r2).toFixed(1) + '" y2="' + (c + Math.sin(a) * r2).toFixed(1) + '" stroke="#e7b75f" stroke-width=".8" opacity=".6"/>';
        }
        s += ring(c * 0.3, 1, '#e7b75f', 0.8);
        if (opts.mono) s += '<text x="' + c + '" y="' + c + '" fill="#e7b75f" font-family="Cinzel, serif" font-weight="700" font-size="' + (size * 0.13).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" letter-spacing="1">' + opts.mono + '</text>';
        s += '</svg>';
        return s;
    };

    /* printing: show every heading in its final, readable form */
    window.addEventListener('beforeprint', () => {
        window.__pkgPrinting = true;
        document.querySelectorAll('[data-final]').forEach((el) => { el.textContent = el.getAttribute('data-final'); });
    });
    window.addEventListener('afterprint', () => { window.__pkgPrinting = false; });

    window.FX = FX;
})();
