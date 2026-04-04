import * as firebase from "./firebase.js";
import { roles } from "./ui.js";

// ゲームのロジックをここに記述

// ゲームが開始したかどうかの判定
export function isGameStarted(callback){
	firebase.getDate((date)=>{
		callback(normalizeDate(date) !== null);
	});
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
export function assignRoles(callback){
	firebase.getAllPlayers((players)=>{
		if(!players) {
			// alert("参加者がいません");
			callback(1);
			return;
		}

		const rolecounts ={};
		for(const role of roles){
			rolecounts[role.number] = (role.type == "input") ? Number(document.getElementById(role.id).value) : Number(document.getElementById(role.id).innerText);
			if(isNaN(rolecounts[role.number]) || rolecounts[role.number] < 0){
				// alert("役職の数を正しく入力してください");
				callback(2);
				return;
			}
		}

		const names = Object.keys(players);

		const rolecountsArray = [];

		for(const role in rolecounts){
			for(let i = 0; i < rolecounts[role]; i++){
				rolecountsArray.push(role);
			}
		}

		shuffle(rolecountsArray);

		names.forEach((name, i)=>{
			firebase.updateRole(name, Number(rolecountsArray[i % rolecountsArray.length]));
		});
		callback(0);
	});
}


//　日付の正規化関数
function normalizeDate(rawDate){
	if(rawDate === null || rawDate === undefined) return null;
	if(typeof rawDate === "object" && rawDate !== null && "date" in rawDate){
		return Number(rawDate.date);
	}
	return Number(rawDate);
}

// 時間の正規化関数
function normalizeTime(rawTime){
	if(rawTime === null || rawTime === undefined) return null;
	if(typeof rawTime === "object" && rawTime !== null && "time" in rawTime){
		return Boolean(rawTime.time);
	}
	return Boolean(rawTime);
}

// プレイヤーの生存者の配列を取得、[[name, player], ...]の形式
function getAlivePlayers(players){
	if(!players) return [];
	return Object.entries(players).filter(([, player]) => player && player.alive);
}

// 最多投票先を取得する関数、同数の場合は複数返す、入力は{target: count, ...}の形式、返り値は[target1, target2, ...]の形式
function getTopVotes(voteCounts){
	const entries = Object.entries(voteCounts);
	if(entries.length === 0) return [];

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

// 投票前の状態を更新する関数
async function updateBeforeVoteForAll(snapPlayers){
	if(!snapPlayers) return;
	for(const name in snapPlayers){
		await firebase.updateBeforeVote(name, snapPlayers[name].vote ?? null);
	}
}

// プレイヤー情報をフェーズ開始前のスナップショット形式で作成する関数、{name: {playerData, beforeVote}, ...}の形式を返す
// beforeVoteは投票前の状態を保持するためのフィールドで、ゲームの進行に応じて更新されるのを防ぐ
function createPhaseSnapshot(players){
	if(!players) return {};
	const snapshot = {};
	for(const name in players){
		snapshot[name] = {
			...players[name],
			beforeVote: players[name]?.vote ?? null
		};
	}
	return snapshot;
}

// 投票前の状態をFirebaseに記録する関数
async function recordBeforeVoteSnapshot(snapPlayers){
	if(!snapPlayers) return;
	for(const name in snapPlayers){
		await firebase.updateBeforeVote(name, snapPlayers[name].beforeVote ?? null);
	}
}

// 生存者全員の投票をクリアする関数
async function clearVotesForAlive(players){
	for(const [name] of getAlivePlayers(players)){
		await firebase.updateVote(name, null);
	}
}

// プレイヤーを殺す関数
async function killPlayer(name){
	if(!name) return;
	await firebase.updateAlive(name, false);
}

// 投票の集計関数、voterFilterは投票者をフィルタリングする関数、出力は{target: count, ...}の形式
function countVotes(players, voterFilter){
	const aliveSet = new Set(getAlivePlayers(players).map(([name]) => name));
	const voteCounts = {};

	for(const [name, player] of getAlivePlayers(players)){
		if(!voterFilter(name, player)) continue;
		const target = player.beforeVote;
		if(!target || !aliveSet.has(target)) continue;
		voteCounts[target] = (voteCounts[target] || 0) + 1;
	}

	return voteCounts;
}

// 再投票の開始処理, revoteCountをインクリメント
async function startRevote(players){
	//await updateBeforeVoteForAll(players);
	await clearVotesForAlive(players);
	//await firebase.updateAllIsDone(false);
	await firebase.incrementRevoteCount();
}

// 夜の処理の関数の最後に、日付を進める処理と時間を昼にする処理
async function endNightPhase(snapPlayers, date){
	// 昼にしてから、beforeVoteを更新することで、占い師の占い結果が夜の投票に影響しないようにする
	await clearVotesForAlive(snapPlayers);
	await firebase.resetRevoteCount();
	await firebase.updateTime(true);
	await firebase.updateDate(Number(date) + 1);
	await recordBeforeVoteSnapshot(snapPlayers);
	//checkWinner((winner)=>{});
}

//　夜の処理の関数
async function resolveNightPhase(settings, snapPlayers, date, revoteCount){
	// 設定の取得、設定がない場合はデフォルト値を使用
	const firstNightAttack = settings.firstNightAttack ?? false;
	const randomKillSameVote = settings.randomKillSameVote ?? true;
	const maxRevoteCount = settings.maxRevoteCount ?? 1;

	// 初日の夜の処理、「初日の夜は人狼の襲撃オフ」のときはなし
	const isFirstNight = Number(date) === 0;
	if(!firstNightAttack && isFirstNight){
		await endNightPhase(snapPlayers, date);
		return;
	} else {
		// 人狼の投票集計
		const wolfVoteCounts = countVotes(snapPlayers, (_name, player) => Number(player.role) === 1 && player.alive);
		const targets = getTopVotes(wolfVoteCounts);

		// 同数投票の処理
		if (targets.length !== 1) {	// 同数投票のとき
			// ランダムに1人殺す設定のときはランダムに1人殺す
			if (randomKillSameVote || revoteCount >= maxRevoteCount) {
				const randomTarget = pickRandomTarget(targets);
				await killPlayer(randomTarget);
				await endNightPhase(snapPlayers, date);
				return;
			}
			// そうでないときは再投票
			await startRevote(snapPlayers);
			return;
		} else {
			// 投票数が1位の人を殺す
			await killPlayer(targets[0]);
			await endNightPhase(snapPlayers, date);
		}
	}
}

// 昼の処理の関数の最後に、勝敗の判定と表示を行う処理
async function endDayPhase(snapPlayers){
	// beforeVoteを更新してから夜に移行することで、占い師の結果を正しく反映させる
	await clearVotesForAlive(snapPlayers);
	await firebase.resetRevoteCount();
	await recordBeforeVoteSnapshot(snapPlayers);
	await firebase.updateTime(false);
	//checkWinner((winner)=>{});
}

// 昼の処理の関数
async function resolveDayPhase(settings, snapPlayers, date, revoteCount){
	// 設定の取得、設定がない場合はデフォルト値を使用
	const randomKillSameVote = settings.randomKillSameVote ?? false;
	const revote = settings.revote ?? true;
	const maxRevoteCount = settings.maxRevoteCount ?? 1;
	const firstDayException = settings.firstDayExecution ?? false;
	
	// 初日の例外処理、初日に投票が行われない設定のときは投票なしで夜に移行
	const isFirstDay = Number(date) === 1;
	if(isFirstDay && !firstDayException){
		await endDayPhase(snapPlayers);
		return;
	} else {
		// 投票の集計と処理
		const dayVoteCounts = countVotes(snapPlayers, () => true);
		const targets = getTopVotes(dayVoteCounts);

		if (targets.length !== 1) {
			if (randomKillSameVote || revoteCount >= maxRevoteCount) {
				const randomTarget = pickRandomTarget(targets);
				await killPlayer(randomTarget);
				await endDayPhase(snapPlayers);
			} else if (revote) {
				await startRevote(snapPlayers);
				return;
			}else{
				// 再投票もなしのときは誰も処刑せずに夜に移行
				await endDayPhase(snapPlayers);
			}
		} else {
			await killPlayer(targets[0]);
			await endDayPhase(snapPlayers);
		}
	}
}

// 勝った時の処理
export async function handleWin(winteam, addpoint){
	firebase.getAllPlayers((players)=>{
		for(const name in players){
			if(roles[players[name].role]?.team == winteam){
				firebase.addScore(name, addpoint);
			}
		}
	});
}

//　どちらが勝ったのかの判定
export function checkWinner(callback){
	firebase.getCountAlivePlayers((aliveCount)=>{
		firebase.getRoleCount(1, (wolfCount)=>{
			if(wolfCount == 0){
				firebase.updateWinner(1);
				handleWin(1, 3);
				callback(1);
			}else if(wolfCount >= aliveCount - wolfCount){
				firebase.updateWinner(2);
				handleWin(2, 5);
				callback(2);
			}else{
				//firebase.updateWinner(0);
				callback(0);
			}
		});
	});
}

// 次のフェーズへの移行処理
export async function goNextPhase(){
	firebase.getAllDataOnce(async (Data)=>{
		if(!Data || !Data.game || !Data.players){
			throw new Error("ゲームデータが不完全です");
		}

		const snapPlayers = createPhaseSnapshot(Data.players);

		const date = normalizeDate(Data.game.date);
		const time = normalizeTime(Data.game.time);
		const settings = Data.settings ?? {};

		if(time === null || date === null){
			throw new Error("ゲームの時間データが不完全です");
		}else if(!time){
			await resolveNightPhase(settings, snapPlayers, date, Number(Data.game.revoteCount));
		}else{
			await resolveDayPhase(settings, snapPlayers, date, Number(Data.game.revoteCount));
		}

		checkWinner((_winner)=>{});
	});
}