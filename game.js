import * as firebase from "./firebase.js";
import { ROLE, roles } from "./role.js";

// ゲームが開始したかどうかの判定
export async function isGameStarted(){
	const date = await firebase.getDate();
	return (date != null && date >= 0);
}

// シャッフル関数
function shuffle(array){
	for(let i = array.length - 1; i > 0; i--){
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

// 役職のシャッフルと配布
export async function assignRoles(){
	const players = await firebase.getAllPlayers();
	if(!players) {
		alert("参加者がいません");
		return;
	}

	const isgameStarted = await isGameStarted();
	if(isgameStarted){
		alert("ゲーム開始後は役職の再配布はできません");
		return;
	}

	const rolecounts = {};
	for (const role of roles) {
		rolecounts[role.number] = (role.type == "input") ? Number(document.getElementById(role.id).value) : Number(document.getElementById(role.id).innerText);
		if (isNaN(rolecounts[role.number]) || rolecounts[role.number] < 0) {
			alert("役職の数を正しく入力してください");
			return;
		}
	}

	await firebase.updateAllRole(-1);

	const roleArray = [];

	for (const role in rolecounts) {
		for (let i = 0; i < rolecounts[role]; i++) {
			roleArray.push(role);
		}
	}

	shuffle(roleArray);

	const names = Object.keys(players);
	for (let i = 0; i < names.length; i++) {
		await firebase.updateRole(names[i], Number(roleArray[i]));
	}
}

// 入力されたプレイヤーのオブジェクトから生存者の配列を取得、[["name", {alive: true, ...}], ...]の形式
function getAlivePlayers(snapPlayers){
	if(!snapPlayers) return [];
	return Object.entries(snapPlayers).filter(([, player]) => player && player.alive);
}

// 投票の集計関数、voterFilterは投票者をフィルタリングする関数、aliveのみや人狼のみなど。出力は{target: count, ...}の形式
function countVotes(snapPlayers, voterFilter){
	const aliveSet = new Set(getAlivePlayers(snapPlayers).map(([name]) => name));
	const voteCounts = {};

	for(const [name, player] of getAlivePlayers(snapPlayers)){
		if(!voterFilter(name, player)) continue;
		const target = player.vote;
		if(!target || !aliveSet.has(target)) continue;
		voteCounts[target] = (voteCounts[target] || 0) + 1;
	}

	return voteCounts;
}

// 最多投票先を取得する関数、同数の場合は複数返す、入力は{target: count, ...}の形式、返り値は[target1, target2, ...]の形式
function getTopVotes(voteCounts){
	const entries = Object.entries(voteCounts);
	if(entries.length == 0) return [];

	let maxVotes = 0;
	for(const [, count] of entries){
		if(count > maxVotes) maxVotes = count;
	}

	return entries
		.filter(([, count]) => count === maxVotes)
		.map(([name]) => name);
}

// 同数投票の中からランダムに1人選ぶ関数
function pickRandomTarget(targets){
	if(!targets || targets.length === 0) return null;
	const randomIndex = Math.floor(Math.random() * targets.length);
	return targets[randomIndex];
}

// 投票の状態をFirebaseに記録する関数
async function recordBeforeVoteSnapshot(snapPlayers){
	for(const name in snapPlayers){
		await firebase.updateBeforeVote(name, snapPlayers[name].vote);
	}
}

function getProtectedByKnight(snapPlayers){
	const knightPlayers = Object.entries(snapPlayers)
		.filter(([, player]) => player && player.role == ROLE.KNIGHT && player.alive);
	if(knightPlayers.length == 0) return [];
	const protectedByKnightPlayers = Object.entries(snapPlayers)
		.filter(([name, player]) => player && knightPlayers.some(([, knight]) => knight.vote == name));

	return protectedByKnightPlayers.map(([name]) => name);
}

// 逃亡者の関数「逃亡者が人狼を選んでいたら逃亡者が死亡」
async function handleFugitive(snapPlayers){
	for(const [name, player] of Object.entries(snapPlayers)){
		if(!player || !player.alive) continue;
		if(player.role != ROLE.FUGITIVE) continue;
		const voteRole = snapPlayers[player.vote]?.role;
		if(voteRole == ROLE.WOLF){
			await firebase.updateAlive(name, false);
		}
	}
}

// 社畜や逃亡者の関数、「襲撃先と同じ相手を選んでいたら社畜が死亡」
async function movePlayer(snapPlayers, wolvesTarget){
    for(const [name, player] of Object.entries(snapPlayers)){
        if(!player || !player.alive) continue;
        if(player.role != ROLE.CORPORATE_WORKER && player.role != ROLE.FUGITIVE) continue;
        if(player.vote == wolvesTarget){
            await firebase.updateAlive(name, false);
        }
    }
}

// プレイヤーを殺す関数、夜
async function killPlayer(snapPlayers, name){
	await handleFugitive(snapPlayers);
	if(name == null) return;
	const protectedByKnight = getProtectedByKnight(snapPlayers);
	if(protectedByKnight.includes(name)) return;
	const isCorporateWorker = snapPlayers[name].role == ROLE.CORPORATE_WORKER;
	const isFugitive = snapPlayers[name].role == ROLE.FUGITIVE;
	if(isCorporateWorker || isFugitive) return;
	await firebase.updateAlive(name, false);
	await movePlayer(snapPlayers, name);
}

// プレイヤーを処刑する関数、昼
async function ExecutePlayer(snapPlayers, name){
	await firebase.updateBeforeExecution(name);
	if(snapPlayers[name].role == ROLE.TERUTERU) return;
	await firebase.updateAlive(name, false);
}

// 再投票の開始処理, revoteCountをインクリメント
async function startRevote(){
	await firebase.incrementRevoteCount();
}

// 夜の処理の関数の最後に、日付を進める処理と時間を昼にする処理
async function endNightPhase(snapPlayers, date){
	await recordBeforeVoteSnapshot(snapPlayers);
	await firebase.resetRevoteCount();
	await firebase.updateDate(Number(date) + 1);
	await firebase.updateIsDaytime(true);
}

// 昼の処理の関数の最後に、勝敗の判定と表示を行う処理
async function endDayPhase(snapPlayers){
	await firebase.resetRevoteCount();
	await firebase.updateIsDaytime(false);
	await recordBeforeVoteSnapshot(snapPlayers);
}

//　夜の処理の関数
async function resolveNightPhase(settings, snapPlayers, date, revoteCount){
	// 設定の取得、設定がない場合はデフォルト値を使用
	const firstNightAttack = settings.firstNightAttack ?? false;
	const randomKillSameVote = settings.randomKillSameVote ?? true;

	// 初日の夜の処理、「初日の夜は人狼の襲撃オフ」のときはなし
	const isFirstNight = (date == 0);
	if(!firstNightAttack && isFirstNight){
		await endNightPhase(snapPlayers, date);
		return;
	} else {
		// 人狼の投票集計
		const wolfVoteCounts = countVotes(snapPlayers, (_name, player) => (player.role == ROLE.WOLF) && player.alive);
		const targets = getTopVotes(wolfVoteCounts);

		// 同数投票の処理
		if (targets.length !== 1) {	// 同数投票のとき
			// ランダムに1人殺す設定のときはランダムに1人殺す
			if (randomKillSameVote || revoteCount == 1) {
				const randomTarget = pickRandomTarget(targets);
				await killPlayer(snapPlayers, randomTarget);
				await endNightPhase(snapPlayers, date);
				return;
			}
			// そうでないときは再投票
			await startRevote();
			return;
		} else {
			// 投票数が1位の人を殺す
			await killPlayer(snapPlayers, targets[0]);
			await endNightPhase(snapPlayers, date);
			return;
		}	
	}
}

// 昼の処理の関数
async function resolveDayPhase(settings, snapPlayers, date, revoteCount){
	// 設定の取得、設定がない場合はデフォルト値を使用
	const skipExecutionSameVote = settings.skipExecutionSameVote ?? false;
	const revote = settings.revote ?? true;
	const firstDayException = settings.firstDayExecution ?? false;
	
	// 初日の例外処理、初日に投票が行われない設定のときは投票なしで夜に移行
	const isFirstDay = (date == 1);
	if(isFirstDay && !firstDayException){
		await endDayPhase(snapPlayers);
		return;
	} else {
		// 投票の集計と処理
		const dayVoteCounts = countVotes(snapPlayers, () => true);
		const targets = getTopVotes(dayVoteCounts);

		if (targets.length !== 1) { // 同数投票のとき
			if (revote && revoteCount < 1) { // 同数投票のとき、再投票が許可されていて、まだ再投票が行われていないときは再投票
				await startRevote();
				return;
			} else if (skipExecutionSameVote) { // 同数投票のとき、処刑なしの設定のときは処刑なしで夜に移行
				await endDayPhase(snapPlayers);
				return;
			} else {
				const randomTarget = pickRandomTarget(targets);
				await ExecutePlayer(snapPlayers, randomTarget);
				await endDayPhase(snapPlayers);
			}
		} else {
			await ExecutePlayer(snapPlayers, targets[0]);
			await endDayPhase(snapPlayers);
		}
	}
}

// 勝った時のスコア処理
async function handleWin(winteam, addpoint){
	const players = await firebase.getAllPlayers();
	for(const name in players){
		if(roles[players[name].role]?.team == winteam){
			await firebase.addScore(name, addpoint);
		}
	}
}

//　どちらが勝ったのかの判定
export async function checkWinner(isDaytime, snapPlayers){
	const executedPlayer = await firebase.getBeforeExecution();
	if(isDaytime && snapPlayers[executedPlayer]?.role == ROLE.TERUTERU){
		await firebase.updateWinner(3);
		await handleWin(3, 7);
		return 3;
	}
	const aliveCount = await firebase.getCountAlivePlayers();
	const wolfCount = await firebase.getAliveRoleCount(ROLE.WOLF);

	if (wolfCount == 0) {
		await firebase.updateWinner(1);
		await handleWin(1, 3);
		return 1;
	} else if (wolfCount >= aliveCount - wolfCount) {
		await firebase.updateWinner(2);
		await handleWin(2, 5);
		return 2;
	} else {
		return 0;
	}
}

// 次のフェーズへの移行処理
export async function goNextPhase(Data){
	await firebase.updateRand();
	
	const snapPlayers = Data.players;

	const date = Data.game.date;
	const isDaytime = Data.game.isDaytime;
	const settings = Data.settings;

	if(!isDaytime){
		await resolveNightPhase(settings, snapPlayers, date, Number(Data.game.revoteCount));
	}else{
		await resolveDayPhase(settings, snapPlayers, date, Number(Data.game.revoteCount));
	}
	await checkWinner(isDaytime, snapPlayers);
}