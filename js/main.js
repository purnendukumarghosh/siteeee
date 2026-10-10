/* Boot everything once the DOM and deferred scripts are ready. */
(function () {
    'use strict';

    const P = window.PROFILE;
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const safe = (name, fn) => {
        try { return fn(); } catch (e) { console.error('[pkg-os] ' + name + ' failed:', e); return null; }
    };

    const ICONS = {
        github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
        email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
    };

    /* ---------- codex (résumé) ---------- */
    function renderCodex() {
        $('codex-name').textContent = P.name;
        $('codex-summary').textContent = P.summary;
        $('seal').innerHTML = FX.sigil(P.name, 200, { mono: 'PKG' });
        $('sys-sigil').innerHTML = FX.sigil('pkg-os-node', 150, { mono: 'OS' });

        const L = P.links;
        $('codex-links').innerHTML = [
            ['GITHUB', L.github, L.github.replace(/^https?:\/\//, '')],
            ['LINKEDIN', L.linkedin, L.linkedin.replace(/^https?:\/\//, '')],
            ['EMAIL', 'mailto:' + L.email, L.email]
        ].map((x) => '<li><a href="' + esc(x[1]) + '"' + (x[0] === 'EMAIL' ? '' : ' target="_blank" rel="noopener"') + '><span>' + x[0] + '</span>' + esc(x[2]) + '</a></li>').join('');

        const entry = (e) =>
            '<div class="entry"><div class="entry-top"><h4 class="decrypt">' + esc(e.title) + '</h4><span class="when">' + esc(e.when) + '</span></div>' +
            '<p class="org">' + esc(e.org) + '</p><ul>' + e.points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></div>';
        $('ch-education').innerHTML = P.education.map(entry).join('');
        $('ch-experience').innerHTML = P.experience.map(entry).join('');
        $('ch-certs').innerHTML = P.certifications.map((c) =>
            '<div class="seal-card"><span class="glyph">' + esc(c.glyph) + '</span><h4>' + esc(c.title) + '</h4><code>' + esc(c.code) + '</code></div>').join('');
        $('ch-projects').innerHTML = P.projects.map((p) =>
            '<div class="artifact"><span class="codename">' + esc(p.codename) + '</span><h4 class="decrypt">' + esc(p.title) + '</h4><p>' + esc(p.desc) + '</p>' +
            '<div class="tags">' + p.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div></div>').join('');

        $('cert-count').textContent = String(P.certifications.length);
        $('hero-status').textContent = P.status;
        $('year').textContent = String(new Date().getFullYear());
        $('print-btn').addEventListener('click', () => window.print());
    }

    /* ---------- contact ---------- */
    const RUNE_MAP = {
        a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ', g: 'ᚷ', h: 'ᚺ', i: 'ᛁ', j: 'ᛃ', k: 'ᚲ', l: 'ᛚ', m: 'ᛗ',
        n: 'ᚾ', o: 'ᛟ', p: 'ᛈ', q: 'ᚲ', r: 'ᚱ', s: 'ᛊ', t: 'ᛏ', u: 'ᚢ', v: 'ᚹ', w: 'ᚹ', x: 'ᚲᛊ', y: 'ᛃ', z: 'ᛉ'
    };
    const toRunes = (text) => text.toLowerCase()
        .replace(/th/g, 'ᚦ').replace(/ng/g, 'ᛜ')
        .replace(/[a-z]/g, (ch) => RUNE_MAP[ch] || ch)
        .replace(/[.!?]/g, ' ᛫ ');

    function renderContact() {
        const L = P.links;
        $('channels').innerHTML = [
            ['github', 'GITHUB', L.github, L.github.replace(/^https?:\/\//, '')],
            ['linkedin', 'LINKEDIN', L.linkedin, L.linkedin.replace(/^https?:\/\//, '')],
            ['email', 'EMAIL', 'mailto:' + L.email, L.email]
        ].map((c) =>
            '<a class="channel" href="' + esc(c[2]) + '"' + (c[0] === 'email' ? '' : ' target="_blank" rel="noopener"') + ' data-cursor="open">' +
            '<span class="ico">' + ICONS[c[0]] + '</span><span><span class="lbl">' + c[1] + '</span><br><span class="val">' + esc(c[3]) + '</span></span><span class="arr">→</span></a>'
        ).join('');

        const name = $('c-name'), msg = $('c-msg'), out = $('rune-text');
        const update = () => {
            const txt = (msg.value || name.value || 'hello from the old world').slice(0, 400);
            out.textContent = toRunes(txt);
        };
        name.addEventListener('input', update);
        msg.addEventListener('input', update);
        $('composer').addEventListener('submit', (e) => {
            e.preventDefault();
            if (!msg.value.trim()) {
                msg.focus();
                FX.toast('Write a message first.');
                return;
            }
            const subject = 'Hello from ' + (name.value.trim() || 'a visitor') + ' (via portfolio)';
            window.location.href = 'mailto:' + L.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(msg.value);
            FX.toast('Opening your email app…');
        });
    }

    /* ---------- start ---------- */
    function start() {
        safe('codex', renderCodex);
        safe('contact', renderContact);
        safe('boot', FX.boot);
        safe('nav', FX.initNav);
        safe('clock', FX.initClock);
        safe('cursor', FX.initCursor);
        safe('ticker', () => FX.initTicker($('ticker-move'), P.facts));
        safe('roles', () => FX.typeRoles($('role-typer'), P.roles));
        safe('konami', FX.initKonami);

        safe('hero', () => window.initHero($('hero-canvas'), $('hero-readout')));
        const skills = safe('skills', () => window.initSkills());
        safe('myths', () => window.initMyths($('myth-grid')));
        safe('terminal', () => window.initTerminal({
            selectSkill: (id) => skills && skills.select(id),
            toggleMatrix: FX.toggleMatrix
        }));

        safe('reveal', FX.initReveal);
        safe('tilt', () => FX.tilt('.artifact'));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
