const DARK_VARS = {
    '--card':            '#2a2a2a',
    '--card-border':     '#444444',
    '--text':            '#e0e0e0',
    '--muted':           '#9aabb7',
    '--line':            '#555555',
    '--shadow':          '0 10px 24px rgba(0, 0, 0, 0.6)',
    '--btn-top':         '#1a5fa8',
    '--btn-bottom':      '#0d3d6e',
    '--btn-shadow':      'rgba(13, 61, 110, 0.4)',
    '--btn-hover-top':   '#2472c2',
    '--btn-hover-bottom':'#1050a0',
    '--list-bg':         'rgb(17, 16, 16)',
    '--list-border':     '#555555',
};

export function setDarkMode() {
    document.body.style.background = '#000000';
    const root = document.documentElement;
    for (const [key, value] of Object.entries(DARK_VARS)) {
        root.style.setProperty(key, value);
    }
}

export function resetTheme() {
    document.body.style.removeProperty('background');
    const root = document.documentElement;
    for (const key of Object.keys(DARK_VARS)) {
        root.style.removeProperty(key);
    }
}
