/* =====================================================================
   PROFILE DATA — edit this file to update the site's content.
   Everything the page shows (résumé, skills, links, facts) lives here.
   ===================================================================== */
window.PROFILE = {
    name: 'Purnendu Kumar Ghosh',
    first: 'PURNENDU',
    last: 'KUMAR GHOSH',
    handle: 'purnendu',
    roles: [
        'Full-Stack Developer',
        'Cloud & Security Builder',
        'AI / ML Tinkerer',
        'Keeper of Ancient Protocols'
    ],
    summary: 'Computer Science graduate (2026) who builds full-stack web apps, cloud infrastructure and ML-driven tools. I like systems that are fast, secure and understandable — and I like knowing the history behind the tech I use.',
    status: 'Open to opportunities',

    // TODO: replace the placeholders below with your real links.
    links: {
        github: 'https://github.com/purnendukumarghosh',
        linkedin: 'https://linkedin.com/in/tech-student',
        email: 'student@example.com'
    },

    education: [
        {
            title: 'B.Tech — Computer Science & Engineering',
            org: 'Chandigarh University',
            when: '2022 — 2026',
            points: ['CGPA: 7 / 10']
        }
    ],

    experience: [
        {
            title: 'Software Intern',
            org: 'TechCorp',
            when: 'Jun 2025 — Aug 2025',
            points: [
                'Built REST APIs serving 10k+ daily requests',
                'Reduced page load time by 40%'
            ]
        }
    ],

    // Not currently shown on the site (the "Seals of Mastery" chapter was removed).
    certifications: [
        { title: 'Oracle Cloud Infrastructure 2025 AI Foundations Associate', code: '1Z0-1122-25', glyph: 'ᛟ' },
        { title: 'DORA Compliance in the EU for Financial Services', code: 'EU · DORA', glyph: 'ᛉ' },
        { title: 'Redis Certified: Associate Software Operator', code: 'REDIS', glyph: 'ᚱ' }
    ],

    // Project descriptions are short and generic — expand them with your real details.
    projects: [
        {
            codename: 'HIDDEN TUNNEL',
            title: 'Cloud-Based Secure VPN Access',
            desc: 'Cloud-hosted VPN gateway that gives remote users encrypted, authenticated access to private resources.',
            tags: ['Cloud', 'Linux', 'Networking', 'Encryption']
        },
        {
            codename: 'ARGUS',
            title: 'ML-Enabled Fraud Detection System',
            desc: 'Machine-learning pipeline that scores transactions and flags the suspicious ones for review.',
            tags: ['Python', 'Machine Learning', 'Data']
        },
        {
            codename: 'SEER’S LENS',
            title: 'Data Visualization Dashboard',
            desc: 'Interactive dashboard that turns raw datasets into charts people can actually read.',
            tags: ['JavaScript', 'Data Viz', 'Web']
        },
        {
            codename: 'PKG//OS',
            title: 'This Portfolio',
            desc: 'Hand-built interactive portfolio: WebGL scenes, a working shell and a 3D Myth Lab — no frameworks.',
            tags: ['Three.js', 'WebGL', 'Vanilla JS']
        }
    ],

    /* Skill constellation.
       cat   → category id (see skillCats)
       rune  → glyph shown on the star
       title → its "ancient" name
       lore  → a real history fact about the technology */
    skillCats: [
        { id: 'lang',  name: 'Languages',       color: '#3dff8f' },
        { id: 'front', name: 'Frontend',        color: '#4de1ff' },
        { id: 'back',  name: 'Backend',         color: '#a78bfa' },
        { id: 'data',  name: 'Data',            color: '#ff7a59' },
        { id: 'ops',   name: 'Cloud & DevOps',  color: '#e7b75f' },
        { id: 'ai',    name: 'AI & Security',   color: '#ff4d8d' }
    ],
    skills: [
        { id: 'python', name: 'Python', cat: 'lang', rune: 'ᚠ', title: 'The Serpent Tongue',
          lore: 'Named after Monty Python’s Flying Circus, not the snake. Guido van Rossum first released it in 1991.' },
        { id: 'js', name: 'JavaScript', cat: 'lang', rune: 'ᚢ', title: 'The Living Script',
          lore: 'Brendan Eich wrote the first version in about ten days in May 1995. It was briefly called Mocha, then LiveScript.' },
        { id: 'java', name: 'Java', cat: 'lang', rune: 'ᚦ', title: 'The Oak Bean',
          lore: 'Began in 1991 as “Oak”, reportedly after a tree outside James Gosling’s office.' },
        { id: 'cpp', name: 'C++', cat: 'lang', rune: 'ᚨ', title: 'The Iron Increment',
          lore: 'Bjarne Stroustrup started “C with Classes” in 1979. The ++ is C’s increment operator: C, one better.' },

        { id: 'react', name: 'React', cat: 'front', rune: 'ᚱ', title: 'The Atom of Reaction',
          lore: 'Created by Jordan Walke at Facebook and open-sourced in May 2013.' },
        { id: 'html', name: 'HTML5', cat: 'front', rune: 'ᚲ', title: 'The Bones of the Web',
          lore: 'Tim Berners-Lee’s first public “HTML Tags” document (1991) described just 18 elements.' },
        { id: 'css', name: 'CSS3', cat: 'front', rune: 'ᚷ', title: 'The Weaver’s Cascade',
          lore: 'Håkon Wium Lie proposed Cascading HTML Style Sheets on 10 October 1994 while at CERN.' },
        { id: 'tailwind', name: 'Tailwind', cat: 'front', rune: 'ᚹ', title: 'The Utility Winds',
          lore: 'Adam Wathan’s utility-first CSS framework was first released in late 2017.' },

        { id: 'node', name: 'Node.js', cat: 'back', rune: 'ᚺ', title: 'The Unblocking Loop',
          lore: 'Ryan Dahl unveiled Node.js at JSConf EU in 2009, built on Chrome’s V8 engine.' },
        { id: 'express', name: 'Express', cat: 'back', rune: 'ᚾ', title: 'The Swift Courier',
          lore: 'Created by TJ Holowaychuk in 2010 — the “E” in the MEAN and MERN stacks.' },
        { id: 'django', name: 'Django', cat: 'back', rune: 'ᛁ', title: 'The Bard’s Framework',
          lore: 'Named after jazz guitarist Django Reinhardt. Born in a newsroom and open-sourced in 2005.' },

        { id: 'mongo', name: 'MongoDB', cat: 'data', rune: 'ᛃ', title: 'The Humongous Archive',
          lore: 'The name comes from “humongous”. First released in 2009.' },
        { id: 'postgres', name: 'PostgreSQL', cat: 'data', rune: 'ᛇ', title: 'The Elephant Ledger',
          lore: 'Descends from POSTGRES, begun in 1986 at UC Berkeley by Michael Stonebraker.' },
        { id: 'redis', name: 'Redis', cat: 'data', rune: 'ᛈ', title: 'The Memory Shrine',
          lore: 'REmote DIctionary Server. Salvatore Sanfilippo created it in 2009 to scale a real-time analytics tool.' },
        { id: 'dataviz', name: 'Data Viz', cat: 'data', rune: 'ᛊ', title: 'The Seer’s Lens',
          lore: 'Florence Nightingale’s 1858 polar-area “rose” diagrams used data visualisation to change hospital policy.' },

        { id: 'git', name: 'Git', cat: 'ops', rune: 'ᛏ', title: 'The Chronicle Keeper',
          lore: 'Linus Torvalds wrote Git in 2005 after the Linux kernel lost free use of BitKeeper.' },
        { id: 'docker', name: 'Docker', cat: 'ops', rune: 'ᛒ', title: 'The Vessel',
          lore: 'Solomon Hykes showed Docker publicly at PyCon 2013; it made Linux containers mainstream.' },
        { id: 'aws', name: 'AWS', cat: 'ops', rune: 'ᛖ', title: 'The Cloud Citadel',
          lore: 'Amazon S3 launched on 14 March 2006 — Pi Day. EC2 followed that August.' },
        { id: 'linux', name: 'Linux', cat: 'ops', rune: 'ᛗ', title: 'The Penguin Order',
          lore: 'Announced on 25 August 1991 by Linus Torvalds as “just a hobby, won’t be big and professional”.' },
        { id: 'oci', name: 'Oracle Cloud', cat: 'ops', rune: 'ᛚ', title: 'The Red Cloud',
          lore: 'Oracle took its name from a CIA-funded database project codenamed “Oracle” that Larry Ellison worked on at Ampex.' },

        { id: 'ml', name: 'Machine Learning', cat: 'ai', rune: 'ᛜ', title: 'The Learning Engine',
          lore: 'Arthur Samuel coined the term in 1959 while teaching an IBM computer to play checkers.' },
        { id: 'netsec', name: 'Network Security', cat: 'ai', rune: 'ᛞ', title: 'The Hidden Tunnel',
          lore: 'Microsoft’s PPTP (1996) was one of the first widely used VPN protocols — and is now considered insecure.' },
        { id: 'dora', name: 'Compliance · DORA', cat: 'ai', rune: 'ᛟ', title: 'The Resilience Edict',
          lore: 'The EU Digital Operational Resilience Act has applied to financial entities since 17 January 2025.' }
    ],
    // Extra links between stars (same-category neighbours are linked automatically).
    skillLinks: [
        ['js', 'react'], ['js', 'node'], ['node', 'express'], ['python', 'django'], ['python', 'ml'],
        ['docker', 'linux'], ['aws', 'docker'], ['redis', 'node'], ['postgres', 'django'], ['mongo', 'node'],
        ['html', 'js'], ['netsec', 'linux'], ['netsec', 'aws'], ['oci', 'ml'], ['git', 'linux'],
        ['dataviz', 'js'], ['dataviz', 'python'], ['dora', 'netsec'], ['java', 'cpp']
    ],

    // Scrolling "intel feed" of tech history.
    facts: [
        '1804 — Jacquard’s loom reads punched cards: programmable input, two centuries early.',
        '1837 — Charles Babbage designs the Analytical Engine, a general-purpose mechanical computer. It was never finished.',
        '1843 — Ada Lovelace publishes Note G, an algorithm for computing Bernoulli numbers on Babbage’s engine.',
        '1936 — Alan Turing describes the universal machine in “On Computable Numbers”.',
        '1947 — A moth is taped into the Harvard Mark II logbook: “First actual case of bug being found.” Engineers already said “bug” — Edison used it in 1878.',
        '1969 — ARPANET’s first message was “LO”. The system crashed two letters into “LOGIN”.',
        '1969 — The Apollo Guidance Computer flew to the Moon with 2,048 words of erasable memory.',
        '1971 — Creeper, the first self-replicating program, crawled ARPANET: “I’M THE CREEPER: CATCH ME IF YOU CAN.”',
        '1991 — The first website goes live at CERN. A restored copy is still online at info.cern.ch.',
        '2024 — NIST publishes its first post-quantum cryptography standards: FIPS 203, 204 and 205.'
    ]
};
