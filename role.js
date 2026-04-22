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
    MISUNDERSTOOD_WOLF: 9,
    FUGITIVE: 10,
    STREAMER: 11,
    BETRAYER: 12
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
    { name: "てるてる", id: "count8", type: "input", number: ROLE.TERUTERU, team: TEAM.TERUTERU },
    { name: "勘違い人狼", displayName: "人狼", id: "count9", type: "input", number: ROLE.MISUNDERSTOOD_WOLF, team: TEAM.CITIZEN },
    { name: "逃亡者", id: "count10", type: "input", number: ROLE.FUGITIVE, team: TEAM.CITIZEN },
    { name: "配信者", id: "count11", type: "input", number: ROLE.STREAMER, team: TEAM.CITIZEN },
    { name: "背信者", id: "count12", type: "input", number: ROLE.BETRAYER, team: TEAM.WOLF }
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
        case ROLE.FUGITIVE: return "誰の家に逃げますか？";
        default: return "怪しいと思う人を選んでください";
    }
}

export async function furtuneResultToText(rolenumber, beforeVote, voteRole, settings) {
    const isDaytime = await firebase.getIsDaytime();
    if (isDaytime) {
        const firstNightFortune = settings?.firstNightFortune ?? true;
        const firstDayExecution = settings?.firstDayExecution ?? false;
        const date = await firebase.getDate();
        if (beforeVote != null && (firstNightFortune || date != 1)) {
            if (rolenumber == ROLE.SEER) {
                return (beforeVote + " : " + furtuneToText(voteRole));
            }else if (rolenumber == ROLE.MISUNDERSTOOD_SEER) {
                const ramdomVoteRole = await firebase.getRand();
                return (beforeVote + " : " + furtuneToText(ramdomVoteRole < 0.5 ? ROLE.WOLF : ROLE.CITIZEN));
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
    return (beforeVote || "未選択");
}

export function wolfToText(rolenumber, players) {
    if (!players) return "";

    const wolfPlayers = Object.entries(players)
        .filter(([, player]) => player && player.role == ROLE.WOLF && player.alive)
        .map(([name]) => name);

    if (wolfPlayers.length === 0) return "";

    if (rolenumber == ROLE.BETRAYER) {
        return "人狼は: " + wolfPlayers.join("、");
    }

    return "";
}

export async function streamerResultToText(players){
    if (!players) return "";
    const isDaytime = await firebase.getIsDaytime();
    if (isDaytime) {
        for (const player of Object.values(players)) {
            if (player && player.role == ROLE.STREAMER && player.alive) {
                return "動画がアップされました";
            }
        }
    }
    return "";
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
