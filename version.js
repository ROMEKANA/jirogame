const version = "4.0.0";

export function setVersionText() {
    const versionEl = document.getElementsByClassName("version");
    for (const el of versionEl) {
        el.innerText = version;
    }
    return version;
}