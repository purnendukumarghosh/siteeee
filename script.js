const input = document.getElementById('cmd-input');
const output = document.getElementById('output');
const terminalBody = document.getElementById('terminal-body');

// Keep focus on input when clicking inside the terminal
terminalBody.addEventListener('click', () => {
    input.focus();
});

// Icon click logic - triggers commands automatically
const icons = document.querySelectorAll('.icon');
icons.forEach(icon => {
    icon.addEventListener('click', () => {
        const cmd = icon.getAttribute('data-cmd');
        executeCommand(cmd);
    });
});

// File System Data Simulation
const fileSystem = {
    'about.txt': `Hello! I'm a Tech Graduate Student.
I build things for the web and solve complex problems with code.
I am passionate about software engineering, Web Dev, and AI.`,
    
    'skills.json': `{
  "languages": ["HTML", "CSS", "JavaScript", "Python", "Java"],
  "frameworks": ["React", "Node.js", "Express", "Tailwind"],
  "tools": ["Git", "Docker", "AWS", "Linux"]
}`,
    
    'contact.txt': `You can reach me at:
Email:    student@example.com
GitHub:   github.com/tech-student
LinkedIn: linkedin.com/in/tech-student`
};

const projectsData = `
=========================================
          FEATURED PROJECTS
=========================================

1. E-Commerce Web App
   Tech: React, Node.js, MongoDB
   Info: A full-stack app with Stripe payment integration.

2. Machine Learning Predictor
   Tech: Python, Scikit-Learn
   Info: Predicts housing prices with 85% accuracy.

3. Terminal Portfolio OS
   Tech: HTML, CSS, JS
   Info: You are looking at it right now!
=========================================
`;

// Available Commands
const commands = {
    'help': `Available commands:
  <span class="color-yellow">help</span>       - Show this message
  <span class="color-yellow">ls</span>         - List directory contents
  <span class="color-yellow">cat &lt;file&gt;</span> - View file contents
  <span class="color-yellow">clear</span>      - Clear terminal screen
  <span class="color-yellow">whoami</span>     - Print current user
  <span class="color-yellow">date</span>       - Show current date`,
    
    'ls': `<span class="color-blue">about.txt</span>    <span class="color-blue">skills.json</span>    <span class="color-blue">contact.txt</span>    <span class="color-yellow">view_projects.sh</span>`,
    
    'clear': () => {
        output.innerHTML = '';
    },
    
    'whoami': 'guest',
    
    'date': () => new Date().toString(),
    
    './view_projects.sh': projectsData
};

input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const cmdText = this.value.trim();
        if (cmdText) {
            executeCommand(cmdText, true);
        } else {
            // just print prompt on empty enter
            const promptLine = document.createElement('div');
            promptLine.innerHTML = `<span class="prompt">guest@portfolio:~$</span>`;
            output.appendChild(promptLine);
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
        this.value = '';
    }
});

function executeCommand(cmdText) {
    // Print the prompt and the command the user executed
    const promptLine = document.createElement('div');
    promptLine.innerHTML = `<span class="prompt">guest@portfolio:~$</span> <span class="color-white">${cmdText}</span>`;
    output.appendChild(promptLine);

    const args = cmdText.split(' ').filter(Boolean);
    const cmd = args[0].toLowerCase();
    
    let responseText = '';

    if (cmd === 'clear') {
        commands['clear']();
        return; // Clear removes all output, no need to append
    }

    if (cmd === 'cat') {
        if (args.length > 1) {
            const fileName = args[1];
            if (fileSystem[fileName]) {
                responseText = fileSystem[fileName];
            } else {
                responseText = `cat: ${fileName}: No such file or directory`;
            }
        } else {
            responseText = `cat: missing operand`;
        }
    } else if (commands[cmd]) {
        if (typeof commands[cmd] === 'function') {
            responseText = commands[cmd]();
        } else {
            responseText = commands[cmd];
        }
    } else if (cmd === './view_projects.sh' || cmd === 'sh' && args[1] === 'view_projects.sh' || cmd === 'bash' && args[1] === 'view_projects.sh') {
        responseText = commands['./view_projects.sh'];
    } else {
        responseText = `bash: ${cmd}: command not found`;
    }

    if (responseText) {
        const responseLine = document.createElement('div');
        responseLine.innerHTML = responseText;
        output.appendChild(responseLine);
    }

    // Scroll to the bottom to simulate a real terminal
    terminalBody.scrollTop = terminalBody.scrollHeight;
    
    // Always keep focus on input
    input.focus();
}

// Ensure input is focused when page loads
window.onload = () => input.focus();
