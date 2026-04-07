import * as firebase from "./firebase.js";

export const ROLE = {
    CITIZEN: 0,
    WOLF: 1,
    SEER: 2,
    MADMAN: 3
};

export const TEAM = {
    IN_GAME: 0,
    CITIZEN: 1,
    WOLF: 2
};

export const roles = [
    { name: "市民", id: "citizen-count", type: "display", number: ROLE.CITIZEN, team: TEAM.CITIZEN },
    { name: "人狼", id: "count1", type: "input", number: ROLE.WOLF, team: TEAM.WOLF },
    { name: "占い師", id: "count2", type: "input", number: ROLE.SEER, team: TEAM.CITIZEN },
    { name: "狂人", id: "count3", type: "input", number: ROLE.MADMAN, team: TEAM.WOLF }
];

export const teams = [
    { name: "試合中", id: "team0", number: TEAM.IN_GAME },
    { name: "市民陣営", id: "team1", number: TEAM.CITIZEN },
    { name: "人狼陣営", id: "team2", number: TEAM.WOLF }
];

export function isWolfRole(role) {
    return Number(role) === ROLE.WOLF;
}

export function isSeerRole(role) {
    return Number(role) === ROLE.SEER;
}

export function furtuneToText(fortune) {
    if (fortune == null) return "占い結果がここに表示されます";
    return fortune == 1 ? "人狼です" : "人狼ではありません";
}

export function roleActionToText(role) {
    if (isWolfRole(role)) return "誰を襲撃しますか？";
    if (isSeerRole(role)) return "誰を占いますか？";
    return "怪しいと思う人を選んでください";
}

export async function furtuneResultToText(rolenumber, beforeVote) {
    const settings = await firebase.getSettings();
    if (beforeVote != null && isSeerRole(rolenumber) && (settings?.firstNightFortune ?? true)) {
        const isDaytime = await firebase.getIsDaytime();
        if (isDaytime) {
            const voteRole = await firebase.getRole(beforeVote);
            return (beforeVote + " : " + furtuneToText(voteRole));
        } else {
            return ("");
        }
    } else {
        return ("");
    }
}

export async function actionToText(savedname, gamedata) {
    const settings = await firebase.getSettings();
    if (gamedata.isDaytime) {
        const firstDayExecution = settings?.firstDayExecution ?? false;
        if (!firstDayExecution && gamedata.date == 1) {
            return "初日の昼は処刑がありません。夜を迎えてください";
        } else {
            return "昼になりました。話し合いをしてください";
        }
    } else {
        let rolenumber = await firebase.getRole(savedname);
        const firstNightAttack = settings?.firstNightAttack ?? false;
        const firstNightFortune = settings?.firstNightFortune ?? true;
        if (!firstNightAttack && isWolfRole(rolenumber) && gamedata.date == 0) rolenumber = ROLE.CITIZEN;
        if (!firstNightFortune && isSeerRole(rolenumber) && gamedata.date == 0) rolenumber = ROLE.CITIZEN;
        return roleActionToText(rolenumber);
    }
}
