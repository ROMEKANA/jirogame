const fallbackVersion = "4.0.1";
let cachedVersion = null;

function applyVersionText(version) {
    const versionEl = document.getElementsByClassName("version");
    for (const el of versionEl) {
        el.innerText = version;
    }
}

async function loadVersionFromReadme() {
    if (cachedVersion) return cachedVersion;

    try {
        const res = await fetch("./README.md", { cache: "no-store" });
        if (!res.ok) throw new Error("README fetch failed");

        const text = await res.text();
        // READMEの「ver.4.0.1」や「version 4.0.1」形式を拾う
        const m = text.match(/ver(?:sion)?\.?\s*([0-9]+\.[0-9]+\.[0-9]+)/i);
        cachedVersion = m?.[1] ?? fallbackVersion;
    } catch {
        cachedVersion = fallbackVersion;
    }

    return cachedVersion;
}

export function setVersionText() {
    applyVersionText(cachedVersion ?? fallbackVersion);

    void loadVersionFromReadme().then((version) => {
        applyVersionText(version);
    });

    return cachedVersion ?? fallbackVersion;
}