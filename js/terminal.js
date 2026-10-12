/* pkg-sh: a small portfolio shell. */
(function () {
    'use strict';

    window.initTerminal = function (opts) {
        const P = window.PROFILE;
        const out = document.getElementById('term-out');
        const body = document.getElementById('term-body');
        const form = document.getElementById('term-form');
        const input = document.getElementById('term-input');
        const promptEl = document.getElementById('term-prompt');
        const titleEl = document.getElementById('term-title');
        const chipsEl = document.getElementById('term-chips');
        const cmdCount = document.getElementById('sys-cmds');

        const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const cmdLink = (c) => '<span class="t-cmd" data-run="' + esc(c) + '">' + esc(c) + '</span>';
        let cwd = '~';
        let count = 0;
        const history = [];
        let hIdx = 0;

        const files = {
            '~': ['about.txt', 'skills.json', 'resume.md', 'contact.txt', 'projects/', 'codex/'],
            '~/projects': P.projects.map((p) => p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md'),
            '~/codex': ['runes.txt', 'facts.log']
        };

        const print = (html, cls) => {
            const d = document.createElement('div');
            if (cls) d.className = cls;
            d.innerHTML = html;
            out.appendChild(d);
            body.scrollTop = body.scrollHeight;
            return d;
        };
        const blank = () => print('&nbsp;');
        const setPrompt = () => {
            const p = 'guest@pkg-os:' + cwd + '$';
            promptEl.textContent = p;
            titleEl.textContent = 'guest@pkg-os: ' + cwd;
        };

        const about = () => {
            print('<span class="t-gold t-b">' + esc(P.name) + '</span>  <span class="t-dim">—</span>  <span class="t-acc">' + esc(P.roles[0]) + '</span>');
            print(esc(P.summary), 't-muted');
            print('status: <span class="t-acc">' + esc(P.status) + '</span>');
        };
        const skills = () => {
            P.skillCats.forEach((c) => {
                const list = P.skills.filter((s) => s.cat === c.id).map((s) => '<span style="color:' + c.color + '">' + esc(s.name) + '</span>').join('<span class="t-dim">, </span>');
                print('<span class="t-gold">' + c.name.padEnd(15, ' ') + '</span> ' + list);
            });
            print('<span class="t-dim">→ explore them in 3D: </span>' + cmdLink('goto skills') + '<span class="t-dim">  ·  lore: </span>' + cmdLink('skill python'));
        };
        const projects = () => {
            P.projects.forEach((p, i) => {
                print('<span class="t-gold">[' + String(i + 1).padStart(2, '0') + ']</span> <span class="t-b">' + esc(p.title) + '</span> <span class="t-dim">// ' + esc(p.codename) + '</span>');
                print('     ' + esc(p.desc), 't-muted');
                print('     <span class="t-acc">' + p.tags.map(esc).join(' · ') + '</span>');
            });
        };
        const resume = () => {
            print('<span class="t-gold t-b"># ' + esc(P.name) + '</span>');
            print('<span class="t-cyan">## Education</span>');
            P.education.forEach((e) => {
                print('  ' + esc(e.title) + ' <span class="t-dim">— ' + esc(e.org) + ' (' + esc(e.when) + ')</span>');
                e.points.forEach((p) => print('  · ' + esc(p), 't-muted'));
            });
            print('<span class="t-cyan">## Experience</span>');
            P.experience.forEach((e) => {
                print('  ' + esc(e.title) + ' @ ' + esc(e.org) + ' <span class="t-dim">(' + esc(e.when) + ')</span>');
                e.points.forEach((p) => print('  · ' + esc(p), 't-muted'));
            });
            print('<span class="t-dim">→ full codex: </span>' + cmdLink('goto codex'));
        };
        const contact = () => {
            const L = P.links;
            print('<span class="t-gold">linkedin</span> <a class="t-link" href="' + esc(L.linkedin) + '" target="_blank" rel="noopener">' + esc(L.linkedin.replace(/^https?:\/\//, '')) + '</a>');
            print('<span class="t-gold">email   </span> <a class="t-link" href="mailto:' + esc(L.email) + '">' + esc(L.email) + '</a>');
        };
        const neofetch = () => {
            const art = [
                '    ▄▄▄▄▄▄▄▄▄▄▄    ',
                '   █ ◢◤  ᚠ  ◥◣ █   ',
                '   █   ╱▔▔▔╲   █   ',
                '   █  ▕ PKG ▏  █   ',
                '   █   ╲▁▁▁╱   █   ',
                '   █ ◥◣  ᛟ  ◢◤ █   ',
                '    ▀▀▀▀▀▀▀▀▀▀▀    '
            ];
            const info = [
                '<span class="t-acc t-b">guest</span>@<span class="t-acc t-b">pkg-os</span>',
                '<span class="t-dim">──────────────────</span>',
                '<span class="t-gold">OS     </span> PKG//OS 4.2 (Antikythera)',
                '<span class="t-gold">Kernel </span> codex-6.1',
                '<span class="t-gold">Shell  </span> pkg-sh',
                '<span class="t-gold">Owner  </span> ' + esc(P.name),
                '<span class="t-gold">Stack  </span> ' + P.skills.length + ' skills · ' + P.skillCats.length + ' schools'
            ];
            print(art.map((a, i) => '<span class="t-acc">' + esc(a) + '</span>  ' + (info[i] || '')).join('\n'));
        };

        const commands = {
            help: {
                d: 'list commands', f: () => {
                    print('<span class="t-gold t-b">AVAILABLE COMMANDS</span>');
                    Object.keys(commands).filter((k) => !commands[k].hidden).forEach((k) => {
                        print('  ' + cmdLink(k) + ' '.repeat(Math.max(1, 12 - k.length)) + '<span class="t-muted">' + esc(commands[k].d) + '</span>');
                    });
                    print('<span class="t-dim">tip: Tab completes · ↑/↓ history · click any green command</span>');
                }
            },
            whoami: { d: 'who is behind this machine', f: about },
            about: { d: 'same as whoami', f: about, hidden: true },
            skills: { d: 'list skills by school', f: skills },
            skill: {
                d: 'lore for one skill, e.g. skill redis', f: (args) => {
                    const q = args.join(' ').toLowerCase();
                    const s = P.skills.find((x) => x.id === q || x.name.toLowerCase() === q || x.name.toLowerCase().startsWith(q));
                    if (!q || !s) return print('<span class="t-red">usage: skill &lt;name&gt;</span> <span class="t-dim">— try ' + cmdLink('skill python') + '</span>');
                    print('<span class="t-runes">' + s.rune + '</span>  <span class="t-b">' + esc(s.name) + '</span> <span class="t-gold">“' + esc(s.title) + '”</span>');
                    print(esc(s.lore), 't-muted');
                    if (opts.selectSkill) opts.selectSkill(s.id);
                }
            },
            projects: { d: 'things I have built', f: projects },
            resume: { d: 'print the résumé', f: resume },
            contact: { d: 'ways to reach me', f: contact },
            neofetch: { d: 'system summary', f: neofetch },
            ls: {
                d: 'list files', f: (args) => {
                    const dir = args[0] ? resolveDir(args[0]) : cwd;
                    if (!files[dir]) return print('<span class="t-red">ls: cannot access \'' + esc(args[0]) + '\': no such directory</span>');
                    print(files[dir].map((f) => f.endsWith('/') ? '<span class="t-gold t-b">' + esc(f) + '</span>' : esc(f)).join('   '));
                }
            },
            cd: {
                d: 'change directory', f: (args) => {
                    const dir = !args[0] || args[0] === '~' ? '~' : resolveDir(args[0]);
                    if (!files[dir]) return print('<span class="t-red">cd: ' + esc(args[0]) + ': no such directory</span>');
                    cwd = dir;
                    setPrompt();
                }
            },
            pwd: { d: 'print working directory', f: () => print(cwd.replace('~', '/home/guest')) },
            cat: { d: 'read a file', f: (args) => cat(args[0]) },
            fact: {
                d: 'random tech-history fact', f: () => {
                    const f = P.facts[(Math.random() * P.facts.length) | 0];
                    print('<span class="t-gold">◆</span> ' + esc(f));
                }
            },
            goto: {
                d: 'jump to a section: shell, skills, codex, myths, contact', f: (args) => {
                    const map = { home: 'top', top: 'top', shell: 'shell', skills: 'skills', codex: 'codex', resume: 'codex', myths: 'myths', myth: 'myths', contact: 'contact' };
                    const id = map[(args[0] || '').toLowerCase()];
                    if (!id) return print('<span class="t-red">goto: unknown section</span> <span class="t-dim">— try ' + ['skills', 'codex', 'myths', 'contact'].map((s) => cmdLink('goto ' + s)).join(' ') + '</span>');
                    print('<span class="t-dim">navigating to #' + id + ' …</span>');
                    const el = document.getElementById(id);
                    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 250);
                }
            },
            play: { d: 'play Myth Buster, the 3D game', f: () => { print('<span class="t-acc">loading Myth Buster…</span> <span class="t-dim">blast the myths, spare the facts.</span>'); if (opts.startGame) opts.startGame(); } },
            matrix: { d: 'toggle digital rain', f: () => { const on = opts.toggleMatrix && opts.toggleMatrix(); print(on ? '<span class="t-acc">wake up, neo…</span>' : '<span class="t-dim">rain stopped.</span>'); } },
            date: { d: 'current date and time', f: () => print(new Date().toString()) },
            echo: { d: 'print text', f: (args) => print(esc(args.join(' '))) },
            history: { d: 'command history', f: () => history.forEach((h, i) => print('<span class="t-dim">' + String(i + 1).padStart(4, ' ') + '</span>  ' + esc(h))) },
            clear: { d: 'clear the screen', f: () => { out.innerHTML = ''; } },
            banner: { d: 'show the welcome banner', f: () => banner() },
            sudo: { d: '', hidden: true, f: () => print('<span class="t-gold">guest is not in the sudoers file.</span> <span class="t-dim">This incident will be reported to the Council of Ancients.</span>') },
            exit: { d: '', hidden: true, f: () => print('<span class="t-dim">There is no exit. Only </span>' + cmdLink('goto contact') + '<span class="t-dim">.</span>') },
            hello: { d: '', hidden: true, f: () => print('Hello, traveller. Type ' + cmdLink('help') + ' to begin.') }
        };
        commands.hi = commands.hello;
        commands.man = commands.help;

        function resolveDir(arg) {
            let a = arg.replace(/\/+$/, '');
            if (a === '..') return cwd === '~' ? '~' : '~';
            if (a.startsWith('~/')) return a;
            if (a === '~') return '~';
            return cwd === '~' ? '~/' + a : cwd + '/' + a;
        }

        function cat(name) {
            if (!name) return print('<span class="t-red">cat: missing file operand</span>');
            const n = name.replace(/^\.\//, '');
            const here = files[cwd] || [];
            if (cwd === '~' || n.indexOf('/') === -1 && cwd === '~') {
                if (n === 'about.txt') return about();
                if (n === 'skills.json') {
                    const obj = {};
                    P.skillCats.forEach((c) => { obj[c.name] = P.skills.filter((s) => s.cat === c.id).map((s) => s.name); });
                    return print(esc(JSON.stringify(obj, null, 2)).replace(/&quot;([^&]+)&quot;:/g, '<span class="t-gold">"$1"</span>:').replace(/&quot;([^&]+)&quot;/g, '<span class="t-acc">"$1"</span>'));
                }
                if (n === 'resume.md') return resume();
                if (n === 'contact.txt') return contact();
            }
            if (cwd === '~/projects' && here.indexOf(n) !== -1) {
                const p = P.projects[here.indexOf(n)];
                print('<span class="t-gold t-b"># ' + esc(p.title) + '</span>  <span class="t-dim">codename ' + esc(p.codename) + '</span>');
                print(esc(p.desc), 't-muted');
                return print('<span class="t-acc">' + p.tags.map(esc).join(' · ') + '</span>');
            }
            if (cwd === '~/codex' && n === 'runes.txt') {
                print('<span class="t-runes">ᚠᚢᚦᚨᚱᚲ ᚷᚹᚺᚾᛁᛃ ᛇᛈᛉᛊᛏᛒ ᛖᛗᛚᛜᛞᛟ</span>');
                return print('<span class="t-muted">The Elder Futhark: 24 runes, in use from roughly the 2nd to the 8th century.</span>');
            }
            if (cwd === '~/codex' && n === 'facts.log') return P.facts.forEach((f) => print('<span class="t-gold">◆</span> ' + esc(f)));
            if (here.indexOf(n) !== -1 && n.endsWith('/')) return print('<span class="t-red">cat: ' + esc(n) + ': is a directory</span> <span class="t-dim">— try ' + cmdLink('cd ' + n) + '</span>');
            print('<span class="t-red">cat: ' + esc(name) + ': no such file</span> <span class="t-dim">— try ' + cmdLink('ls') + '</span>');
        }

        function run(raw, silent) {
            const line = raw.trim();
            if (!silent) print('<span class="t-acc">' + esc(promptEl.textContent) + '</span> ' + esc(line));
            if (!line) return;
            history.push(line);
            hIdx = history.length;
            count++;
            if (cmdCount) cmdCount.textContent = String(count);
            const parts = line.split(/\s+/);
            const name = parts[0].toLowerCase();
            const cmd = commands[name];
            if (cmd) {
                cmd.f(parts.slice(1));
            } else {
                const close = Object.keys(commands).find((k) => !commands[k].hidden && (k.startsWith(name.slice(0, 2)) && name.length > 1));
                print('<span class="t-red">pkg-sh: command not found: ' + esc(name) + '</span>' + (close ? ' <span class="t-dim">— did you mean ' + cmdLink(close) + '?</span>' : ' <span class="t-dim">— type ' + cmdLink('help') + '</span>'));
            }
            blank();
            body.scrollTop = body.scrollHeight;
        }

        function banner() {
            print('<span class="t-runes">ᛈᚲᚷ ᛟᛊ</span>  <span class="t-dim">·</span>  <span class="t-b">PKG//OS 4.2</span> <span class="t-dim">— portfolio shell of</span> <span class="t-gold">' + esc(P.name) + '</span>');
            print('<span class="t-muted">Type </span>' + cmdLink('help') + '<span class="t-muted"> for commands, or start with </span>' + cmdLink('whoami') + '<span class="t-muted">.</span>');
            blank();
        }

        /* chips */
        ['help', 'whoami', 'skills', 'projects', 'resume', 'play', 'neofetch', 'fact', 'contact', 'clear'].forEach((c) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip';
            b.textContent = c;
            b.addEventListener('click', () => {
                run(c);
                if (!X3.coarse) input.focus({ preventScroll: true });
            });
            chipsEl.appendChild(b);
        });

        out.addEventListener('click', (e) => {
            const t = e.target.closest('[data-run]');
            if (t) run(t.getAttribute('data-run'));
        });
        body.addEventListener('click', (e) => {
            if (e.target.closest('a, [data-run]')) return;
            if (window.getSelection && String(window.getSelection())) return;
            input.focus({ preventScroll: true });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            run(input.value);
            input.value = '';
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (hIdx > 0) input.value = history[--hIdx];
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (hIdx < history.length - 1) input.value = history[++hIdx];
                else { hIdx = history.length; input.value = ''; }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const v = input.value;
                const parts = v.split(/\s+/);
                if (parts.length === 1) {
                    const m = Object.keys(commands).filter((k) => !commands[k].hidden && k.startsWith(v.toLowerCase()));
                    if (m.length === 1) input.value = m[0] + ' ';
                    else if (m.length > 1) print('<span class="t-dim">' + m.join('   ') + '</span>');
                } else {
                    const last = parts[parts.length - 1];
                    const pool = (parts[0] === 'skill' ? P.skills.map((s) => s.id) : (files[cwd] || []));
                    const m = pool.filter((f) => f.startsWith(last));
                    if (m.length === 1) { parts[parts.length - 1] = m[0]; input.value = parts.join(' '); }
                    else if (m.length > 1) print('<span class="t-dim">' + m.join('   ') + '</span>');
                }
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                out.innerHTML = '';
            }
        });

        setPrompt();
        banner();
        return { run: run };
    };
})();
