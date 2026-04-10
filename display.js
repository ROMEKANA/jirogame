import { roles, teams } from "./role.js";

// ダークモードのCSS変数の変化
const DARK_VARS = {
    '--bg-color':           '#000000',
    '--bg-top':             '#353524',
    '--bg-bottom':          '#0a0a38',
    '--card':               '#2a2a2a',
    '--card-border':        '#444444',
    '--text':               '#e0e0e0',
    '--numberinput-border': '#1a5fa8',
    '--numberinput-focus-border': '#1a5fa8',
    '--numberinput-bg':     '#ffffffb7',
    '--line':               '#555555',
    '--shadow':             '0 10px 24px rgba(0, 0, 0, 0.6)',
    '--btn-color':          '#d3e7fc',
    '--btn-top':            '#1a5fa8',
    '--btn-bottom':         '#0d3d6e',
    '--btn-shadow':         'rgba(13, 61, 110, 0.4)',
    '--btn-hover-top':      '#2472c2',
    '--btn-hover-bottom':   '#1050a0',
    '--list-bg':            'rgb(17, 16, 16)',
    '--list-border':        '#555555',
    '--role-color':         '#ffb59f',
    '--selected-color':     '#b1cefa',
    '--role-assign-bg':     '#cda1ff1c'
};

export function setDarkMode() {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(DARK_VARS)) {
        root.style.setProperty(key, value);
    }
}

export function resetMode() {
    const root = document.documentElement;
    for (const key of Object.keys(DARK_VARS)) {
        root.style.removeProperty(key);
    }
}

// 設定の設定
export const labels = {
    firstNightAttack: ["初夜の襲撃", false],
    revote: ["同数投票時に再投票", true],
    randomKillSameVote: ["夜の同数投票時にランダム襲撃", true],
    skipExecutionSameVote: ["昼の同数投票時に処刑スキップ", true],
    discussionTime: ["議論時間(分)", 3],
    firstNightFortune: ["初夜占い", true],
    firstNightRandomWhite: ["初夜のランダム白出し(未実装)", false],
    firstDayExecution: ["初日の処刑", false],
    revealRoleOnDeath: ["死亡時の役職公開", true]
};

// プレイヤーの役職と生死の更新と取得
function aliveToText(alive) {
    if (alive == null) return "参加前";
    return alive ? "生存" : "死亡";
}

function isDoneToText(isDone) {
    if (isDone == null) return "参加前";
    return isDone ? "行動済み" : "未行動";
}

export function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function viewAllPlayers(isViewAllPlayersRole, players) {
    const el = document.getElementById('player-list');
    el.classList.toggle('with-role-column', !!isViewAllPlayersRole);
    if (!players) {
        el.innerHTML = "";
        return;
    }

    const playersArray = Object.entries(players)
        .sort((a, b) => {
            const PlayerA = a[1];
            const PlayerB = b[1];
            return (PlayerB.alive - PlayerA.alive);
        });


    const lines = playersArray.map(([name, player]) => {
        const roleColumn = isViewAllPlayersRole
            ? `<span class="player-col role">${escapeHtml(roleDisplayToText(player.role))}</span>`
            : "";

        return `
            <div class="player-row">
                <span class="player-col name">${escapeHtml(name)}</span>
                <span class="player-col alive">${escapeHtml(aliveToText(player.alive))}</span>
                <span class="player-col done">${escapeHtml(isDoneToText(player.isDone))}</span>
                ${roleColumn}
            </div>
        `;
    });

    el.innerHTML = lines.join("");
}

// 
export function statusToText(isConnected){
    if(isConnected == null) return "接続します...";
    const root = document.documentElement;
    if(isConnected) {
        root.style.setProperty('--status-color', '#05a500');
        return "接続しました！";
    } else {
        root.style.setProperty('--status-color', '#ff0000');
        return "接続待ち...";
    }
}

export function roleToText(role){
    if(role == null) return "参加前";
    if(role == -1) return "未決定";
    if(role >= 0 && role < roles.length) return roles[role].name;
    return "未定義";
}

export function roleDisplayToText(role){
    if(role == null) return "参加前";
    if(role == -1) return "未決定";
    if(role >= 0 && role < roles.length) return roles[role].displayName ? roles[role].displayName : roles[role].name;
    return "未定義";
}

export function dateToText(date){
    if(date == null) return "開始前";
    if(typeof date == "object" && date != null && "date" in date){
        return `${date.date}日目`;
    }
    return `${date}日目`;
}

export function isDaytimeToText(date){
    if(date == null) return "開始前";
    if(typeof date == "object" && date != null && "isDaytime" in date){
        return date.isDaytime ? "昼" : "夜";
    }
    return date ? "昼" : "夜";
}

export function teamToText(team){
    if(team == null) return "開始前";
    if(team >= 0 && team < teams.length) return teams[team].name;
    return "未定義";
}
