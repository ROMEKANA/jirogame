import * as firebase from "./firebase.js";

export const ROLE = {
    CITIZEN: 0,
    WOLF: 1,
    SEER: 2,
    MADMAN: 3,
    KNIGHT: 4,
    MISUNDERSTOOD_SEER: 5,
    CORPORATE_WORKER: 6,
    MEDIUM: 7,
    TERUTERU: 8,
    MISUNDERSTOOD_WOLF: 9
};

export const TEAM = {
    IN_GAME: 0,
    CITIZEN: 1,
    WOLF: 2,
    TERUTERU: 3
};

export const roles = [
    { name: "市民", id: "citizen-count", type: "display", number: ROLE.CITIZEN, team: TEAM.CITIZEN },
    { name: "人狼", id: "count1", type: "input", number: ROLE.WOLF, team: TEAM.WOLF },
    { name: "占い師", id: "count2", type: "input", number: ROLE.SEER, team: TEAM.CITIZEN },
    { name: "狂人", id: "count3", type: "input", number: ROLE.MADMAN, team: TEAM.WOLF },
    { name: "騎士", id: "count4", type: "input", number: ROLE.KNIGHT, team: TEAM.CITIZEN },
    { name: "勘違い占い師", displayName: "占い師", id: "count5", type: "input", number: ROLE.MISUNDERSTOOD_SEER, team: TEAM.CITIZEN },
    { name: "社畜", id: "count6", type: "input", number: ROLE.CORPORATE_WORKER, team: TEAM.CITIZEN },
    { name: "霊媒師", id: "count7", type: "input", number: ROLE.MEDIUM, team: TEAM.CITIZEN },
    { name: "てるてる(未完成)", id: "count8", type: "input", number: ROLE.TERUTERU, team: TEAM.TERUTERU },
    { name: "勘違い人狼", displayName: "人狼", id: "count9", type: "input", number: ROLE.MISUNDERSTOOD_WOLF, team: TEAM.CITIZEN }
];

export const teams = [
    { name: "試合中", id: "team0", number: TEAM.IN_GAME },
    { name: "市民陣営", id: "team1", number: TEAM.CITIZEN },
    { name: "人狼陣営", id: "team2", number: TEAM.WOLF },
    { name: "てるてる陣営", id: "team3", number: TEAM.TERUTERU }
];

export function furtuneToText(voteRole) {
    if (voteRole == null) return "未定義";
    return voteRole == ROLE.WOLF ? "人狼です" : "人狼ではありません";
}

export function roleActionToText(role) {
    switch (role) {
        case ROLE.WOLF:
        case ROLE.MISUNDERSTOOD_WOLF: return "誰を襲撃しますか？";
        case ROLE.SEER:
        case ROLE.MISUNDERSTOOD_SEER: return "誰を占いますか？";
        case ROLE.KNIGHT: return "誰を守りますか？";
        case ROLE.CORPORATE_WORKER: return "誰の家で仕事をしますか？";
        default: return "怪しいと思う人を選んでください";
    }
}

export async function furtuneResultToText(rolenumber, beforeVote) {
    const isDaytime = await firebase.getIsDaytime();
    if (isDaytime) {
        const settings = await firebase.getSettings();
        const firstNightFortune = settings?.firstNightFortune ?? true;
        const firstDayExecution = settings?.firstDayExecution ?? false;
        const date = await firebase.getDate();
        if (beforeVote != null && (firstNightFortune || date != 1)) {
            if (rolenumber == ROLE.SEER) {
                const voteRole = await firebase.getRole(beforeVote);
                return (beforeVote + " : " + furtuneToText(voteRole));
            }else if (rolenumber == ROLE.MISUNDERSTOOD_SEER) {
                const voteRole = await firebase.getRand();
                return (beforeVote + " : " + furtuneToText(voteRole < 0.5 ? ROLE.WOLF : ROLE.CITIZEN));
            }
        }
        if(rolenumber == ROLE.MEDIUM && ((date != 1 && !firstDayExecution) || date > 1)){
            const beforeExecution = await firebase.getBeforeExecution();
            if (beforeExecution != null) {
                const voteRole = await firebase.getRole(beforeExecution);
                return (beforeVote + ", " +beforeExecution + " : " + furtuneToText(voteRole));
            }
        }
    } 
    return (beforeVote);
}

export async function actionToText(savedname, gamedata) {
    const settings = await firebase.getSettings();
    if (gamedata.isDaytime) {
        const firstDayExecution = settings?.firstDayExecution ?? false;
        if (!firstDayExecution && gamedata.date == 1) {
            return "初日の昼は処刑がありません。一人選んでください\n（投票はできますが、処刑はされません）";
        } else {
            return "昼になりました。話し合いをしてください";
        }
    } else {
        let rolenumber = await firebase.getRole(savedname);
        const firstNightAttack = settings?.firstNightAttack ?? false;
        const firstNightFortune = settings?.firstNightFortune ?? true;
        if (!firstNightAttack && (rolenumber == ROLE.WOLF || rolenumber == ROLE.MISUNDERSTOOD_WOLF) && gamedata.date == 0) rolenumber = ROLE.CITIZEN;
        if (!firstNightFortune && (rolenumber == ROLE.SEER || rolenumber == ROLE.MISUNDERSTOOD_SEER) && gamedata.date == 0) rolenumber = ROLE.CITIZEN;
        return roleActionToText(rolenumber);
    }
}
