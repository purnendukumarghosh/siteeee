// ===== DOM REFS =====
const input = document.getElementById('cmd-input');
const output = document.getElementById('output');
const terminalBody = document.getElementById('terminal-body');
const termTitle = document.getElementById('term-title');
const clockEl = document.getElementById('clock');

// ===== MATRIX RAIN =====
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/{}[];=+-*&^%$#@!'.split('');
const fontSize = 14;
let columns = Math.floor(canvas.width / fontSize);
let drops = Array(columns).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 45);

window.addEventListener('resize', () => {
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
});

// ===== CLOCK =====
function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false }) + ' | ' + now.toLocaleDateString();
}
updateClock();
setInterval(updateClock, 1000);

// ===== FOCUS =====
terminalBody.addEventListener('click', () => input.focus());
document.addEventListener('keydown', () => input.focus());

// ===== ICON CLICKS =====
document.querySelectorAll('.icon').forEach(icon => {
    icon.addEventListener('click', () => {
        executeCommand(icon.getAttribute('data-cmd'));
    });
});

// ===== CURRENT DIRECTORY STATE =====
let cwd = '~';

// ===== FILE SYSTEM =====
const fs = {
    '~': {
        type: 'dir',
        children: ['about.txt', 'skills.json', 'contact.txt', 'resume.md', 'projects/']
    },
    'about.txt': {
        type: 'file',
        content: `┌─────────────────────────────────────────┐
│              ABOUT ME                   │
├─────────────────────────────────────────┤
│                                         │
│  Name:     CSE Graduate Student  (2026) │
│  Role:     Full-Stack Developer         │
│  Focus:    Web Dev, AI, Systems         │
│                                         │
│  I build things and solve               │
│  complex problems with code. Passionate │
│  about open-source and clean code.      │
│                                         │
│  Currently seeking opportunities.       │
│                                         │
└─────────────────────────────────────────┘`
    },
    'skills.json': {
        type: 'file',
        content: `{
  <span class="c-red">"languages"</span>  : [<span class="c-yellow">"Python"</span>, <span class="c-yellow">"JavaScript"</span>, <span class="c-yellow">"Java"</span>, <span class="c-yellow">"C++"</span>],
  <span class="c-red">"frontend"</span>   : [<span class="c-yellow">"React"</span>, <span class="c-yellow">"HTML5"</span>, <span class="c-yellow">"CSS3"</span>, <span class="c-yellow">"Tailwind"</span>],
  <span class="c-red">"backend"</span>    : [<span class="c-yellow">"Node.js"</span>, <span class="c-yellow">"Express"</span>, <span class="c-yellow">"Django"</span>],
  <span class="c-red">"databases"</span>  : [<span class="c-yellow">"MongoDB"</span>, <span class="c-yellow">"PostgreSQL"</span>, <span class="c-yellow">"Redis"</span>],
  <span class="c-red">"devops"</span>     : [<span class="c-yellow">"Git"</span>, <span class="c-yellow">"Docker"</span>, <span class="c-yellow">"AWS"</span>, <span class="c-yellow">"Linux"</span>]
}`
    },
    'contact.txt': {
        type: 'file',
        content: `<span class="c-cyan">📧 Email</span>     : student@example.com
<span class="c-cyan">🐙 GitHub</span>    : github.com/tech-student
<span class="c-cyan">💼 LinkedIn</span>  : linkedin.com/in/tech-student
<span class="c-cyan">🐦 Twitter</span>   : twitter.com/tech_student`
    },
    'resume.md': {
        type: 'file',
        content: `<span class="c-cyan c-bold"># RESUME</span>

<span class="c-yellow">## Education</span>
  B.Tech Computer Science — chandigarh University (2022-2026)
  CGPA: 7/10

<span class="c-yellow">## Experience</span>
  <span class="c-white">Software Intern @ TechCorp</span>  <span class="c-dim">(Jun 2025 – Aug 2025)</span>
  - Built REST APIs serving 10k+ daily requests
  - Reduced page load time by 40%

<span class="c-yellow">## Certifications</span>
  - Oracle Cloud Infrastructure 2025 AI Certified [1Z0-1122-25]
  - DORA Compliance in the EU for Financial Services
  - Redis Certified: Associate Software Operator`
    },
    'projects/': {
        type: 'dir',
        children: ['Cloud-Based Secure VPN Access/', 'ML-Enabled Fraud Detection System/', 'Data Visualization Dashboard/']
    },
    'ecommerce_app/': {
        type: 'dir',
        children: ['README.md'],
        readme: `<span class="c-cyan c-bold">🛒 Cloud-Based Secure VPN Access </span>
<span class="c-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
<span class="c-yellow">Stack:</span>  React · Node.js · MongoDB · Stripe
<span class="c-yellow">Info:</span>   Full-stack app with auth, cart, and
        Stripe payment integration.
<span class="c-yellow">Link:</span>   <span class="c-cyan">github.com/tech-student/ecommerce</span>`
    },
    'ml_predictor/': {
        type: 'dir',
        children: ['README.md'],
        readme: `<span class="c-cyan c-bold">🤖 Machine Learning Predictor</span>
<span class="c-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
<span class="c-yellow">Stack:</span>  Python · Scikit-Learn · Pandas
<span class="c-yellow">Info:</span>   Predicts housing prices with 85%
        accuracy using Random Forest.
<span class="c-yellow">Link:</span>   <span class="c-cyan">github.com/tech-student/ml-predict</span>`
    },
    'terminal_portfolio/': {
        type: 'dir',
        children: ['README.md'],
        readme: `<span class="c-cyan c-bold">💻 Terminal Portfolio OS</span>
<span class="c-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
<span class="c-yellow">Stack:</span>  HTML · CSS · JavaScript
<span class="c-yellow">Info:</span>   You're looking at it right now!
        A hacker-themed interactive portfolio.
<span class="c-yellow">Link:</span>   <span class="c-cyan">github.com/tech-student/portfolio</span>`
    }
};

// ===== NEOFETCH ASCII =====
const neofetchOutput = `<span class="ascii-art"><span class="c-green">        .--.          </span>  <span class="c-white c-bold">guest</span><span class="c-dim">@</span><span class="c-white c-bold">portfolio</span>
<span class="c-green">       |o_o |         </span>  <span class="c-dim">──────────────────</span>
<span class="c-green">       |:_/ |         </span>  <span class="c-yellow">OS:</span>     PortfolioOS v3.7
<span class="c-green">      //   \\ \\        </span>  <span class="c-yellow">Host:</span>   The Internet
<span class="c-green">     (|     | )       </span>  <span class="c-yellow">Kernel:</span> HTML/CSS/JS
<span class="c-green">    /'\\_   _/\`\\       </span>  <span class="c-yellow">Shell:</span>  portfolio-sh
<span class="c-green">    \\___)=(___/       </span>  <span class="c-yellow">Theme:</span>  Matrix Green</span>`;

// ===== BOOT SEQUENCE =====
function bootSequence() {
    const lines = [
        '<span class="c-dim">[  0.001] Booting PortfolioOS v3.7...</span>',
        '<span class="c-dim">[  0.042] Loading kernel modules...   </span><span class="c-green">[OK]</span>',
        '<span class="c-dim">[  0.128] Mounting filesystem...      </span><span class="c-green">[OK]</span>',
        '<span class="c-dim">[  0.256] Starting network daemon...  </span><span class="c-green">[OK]</span>',
        '<span class="c-dim">[  0.512] Initializing display...     </span><span class="c-green">[OK]</span>',
        '',
        '<span class="c-green c-bold">██████╗ ██╗   ██╗██████╗ ███╗   ██╗███████╗███╗   ██╗██████╗ ██╗   ██╗</span>',
        '<span class="c-green c-bold">██╔══██╗██║   ██║██╔══██╗████╗  ██║██╔════╝████╗  ██║██╔══██╗██║   ██║</span>',
        '<span class="c-green c-bold">██████╔╝██║   ██║██████╔╝██╔██╗ ██║█████╗  ██╔██╗ ██║██║  ██║██║   ██║</span>',
        '<span class="c-green c-bold">██╔═══╝ ██║   ██║██╔══██╗██║╚██╗██║██╔══╝  ██║╚██╗██║██║  ██║██║   ██║</span>',
        '<span class="c-green c-bold">██║     ╚██████╔╝██║  ██║██║ ╚████║███████╗██║ ╚████║██████╔╝╚██████╔╝</span>',
        '<span class="c-green c-bold">╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ </span>',
        '',
        'Welcome, <span class="c-cyan">guest</span>. Type <span class="c-yellow">help</span> for commands.',
        'Click an icon or type to explore.',
        ''
    ];

    lines.forEach(line => {
        const div = document.createElement('div');
        div.innerHTML = line;
        output.appendChild(div);
    });
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

bootSequence();

// ===== HELP TEXT =====
const helpText = `<span class="c-yellow c-bold">AVAILABLE COMMANDS</span>
<span class="c-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
  <span class="c-green">help</span>              Show this help
  <span class="c-green">ls</span>                List files in current dir
  <span class="c-green">cat &lt;file&gt;</span>        View file contents
  <span class="c-green">open &lt;folder&gt;</span>     Open a folder (like cd)
  <span class="c-green">cd &lt;dir&gt;</span>          Navigate directories
  <span class="c-green">cd ..</span>             Go back to parent
  <span class="c-green">tree</span>              Show directory tree
  <span class="c-green">neofetch</span>          System info
  <span class="c-green">whoami</span>            Print current user
  <span class="c-green">date</span>              Show current date & time
  <span class="c-green">clear</span>             Clear terminal
  <span class="c-green">pwd</span>               Print working directory
<span class="c-dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>`;

// ===== TREE =====
const treeText = `<span class="c-yellow">~/home</span>
<span class="tree-line">├── </span><span class="c-white">about.txt</span>
<span class="tree-line">├── </span><span class="c-white">skills.json</span>
<span class="tree-line">├── </span><span class="c-white">contact.txt</span>
<span class="tree-line">├── </span><span class="c-white">resume.md</span>
<span class="tree-line">└── </span><span class="c-yellow">projects/</span>
<span class="tree-line">    ├── </span><span class="c-yellow">ecommerce_app/</span>
<span class="tree-line">    │   └── </span><span class="c-white">README.md</span>
<span class="tree-line">    ├── </span><span class="c-yellow">ml_predictor/</span>
<span class="tree-line">    │   └── </span><span class="c-white">README.md</span>
<span class="tree-line">    └── </span><span class="c-yellow">terminal_portfolio/</span>
<span class="tree-line">        └── </span><span class="c-white">README.md</span>`;

// ===== COMMAND HANDLING =====
input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const cmdText = this.value.trim();
        if (cmdText) {
            executeCommand(cmdText);
        } else {
            printLine(`<span class="c-red c-bold">${getPrompt()}</span>`);
        }
        this.value = '';
    }
});

function getPrompt() {
    return `guest@portfolio:${cwd}$`;
}

function updatePrompt() {
    document.getElementById('prompt').innerHTML = `<span>${getPrompt()}</span>`;
    termTitle.textContent = `guest@portfolio: ${cwd}`;
}

function printLine(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    output.appendChild(div);
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function resolveFile(name) {
    // Try direct match
    if (fs[name]) return fs[name];
    // Try with trailing slash for dirs
    if (fs[name + '/']) return fs[name + '/'];
    return null;
}

function getCurrentDir() {
    if (cwd === '~') return fs['~'];
    const key = cwd.replace('~/', '') + '/';
    return fs[key] || fs['~'];
}

function executeCommand(cmdText) {
    // Echo the command
    printLine(`<span class="c-red c-bold">${getPrompt()}</span> <span class="c-white">${escapeHtml(cmdText)}</span>`);

    const args = cmdText.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    switch (cmd) {
        case 'help':
            printLine(helpText);
            break;

        case 'clear':
            output.innerHTML = '';
            break;

        case 'ls': {
            const dir = getCurrentDir();
            if (dir && dir.children) {
                let listing = '';
                dir.children.forEach(child => {
                    if (child.endsWith('/')) {
                        listing += `<span class="c-yellow">${child}</span>  `;
                    } else {
                        listing += `<span class="c-white">${child}</span>  `;
                    }
                });
                printLine(listing);
            } else {
                printLine('<span class="c-red">Error reading directory</span>');
            }
            break;
        }

        case 'cat': {
            if (!args[1]) {
                printLine('<span class="c-red">cat: missing operand</span>');
                break;
            }
            const fileName = args[1];
            // If inside a project dir, auto-read README.md
            if (cwd.startsWith('~/projects/') && fileName === 'README.md') {
                const dirKey = cwd.replace('~/', '') + '/';
                const dirObj = fs[dirKey];
                if (dirObj && dirObj.readme) {
                    printLine(dirObj.readme);
                } else {
                    printLine(`<span class="c-red">cat: ${fileName}: No such file</span>`);
                }
            } else {
                const file = resolveFile(fileName);
                if (file && file.type === 'file') {
                    printLine(file.content);
                } else if (file && file.type === 'dir') {
                    printLine(`<span class="c-red">cat: ${fileName}: Is a directory. Use 'open ${fileName}' or 'cd ${fileName}'</span>`);
                } else {
                    printLine(`<span class="c-red">cat: ${fileName}: No such file or directory</span>`);
                }
            }
            break;
        }

        case 'open':
        case 'cd': {
            if (!args[1]) {
                cwd = '~';
                updatePrompt();
                break;
            }
            const target = args[1].replace(/\/$/, ''); // strip trailing slash

            if (target === '..' || target === '../') {
                if (cwd === '~') {
                    printLine('<span class="c-dim">Already at root.</span>');
                } else {
                    const parts = cwd.split('/');
                    parts.pop();
                    cwd = parts.join('/') || '~';
                    updatePrompt();
                    // Auto ls
                    executeCommand('ls');
                }
                return;
            }

            if (target === '~' || target === '/') {
                cwd = '~';
                updatePrompt();
                executeCommand('ls');
                return;
            }

            // Try resolving folder
            let resolvedKey;
            if (cwd === '~') {
                resolvedKey = target + '/';
            } else {
                resolvedKey = cwd.replace('~/', '') + '/' + target + '/';
            }

            // Also allow "open projects" to map to "projects/"
            if (fs[resolvedKey] && fs[resolvedKey].type === 'dir') {
                if (cwd === '~') {
                    cwd = '~/' + target;
                } else {
                    cwd = cwd + '/' + target;
                }
                updatePrompt();
                // Auto ls the folder
                executeCommand('ls');

                // If the dir has a readme, show it
                if (fs[resolvedKey].readme) {
                    printLine('');
                    printLine(fs[resolvedKey].readme);
                }
            } else {
                printLine(`<span class="c-red">cd: ${target}: No such directory</span>`);
            }
            return; // we already handle recursion
        }

        case 'pwd':
            printLine(`<span class="c-cyan">${cwd.replace('~', '/home/guest')}</span>`);
            break;

        case 'whoami':
            printLine('<span class="c-cyan">guest</span>');
            break;

        case 'date':
            printLine(`<span class="c-white">${new Date().toString()}</span>`);
            break;

        case 'neofetch':
            printLine(neofetchOutput);
            break;

        case 'tree':
            printLine(treeText);
            break;

        case 'sudo':
            printLine('<span class="c-red">[sudo] Nice try. Access denied. 🛑</span>');
            break;

        case 'rm':
            printLine('<span class="c-red">Permission denied. You can\'t break my portfolio 😏</span>');
            break;

        case 'exit':
            printLine('<span class="c-dim">There is no escape from the matrix...</span>');
            break;

        default:
            printLine(`<span class="c-red">bash: ${escapeHtml(cmd)}: command not found. Type 'help' for commands.</span>`);
    }

    terminalBody.scrollTop = terminalBody.scrollHeight;
    input.focus();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== INIT =====
updatePrompt();
window.onload = () => input.focus();
