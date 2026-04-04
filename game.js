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
function getTopTargets(voteCounts){
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

function pickRandomTarget(targets){
	if(!targets || targets.length === 0) return null;
	const randomIndex = Math.floor(Math.random() * targets.length);
	return targets[randomIndex];
}

// 投票前の状態を更新する関数
async function updateBeforeVoteForAll(players){
	if(!players) return;
	for(const name in players){
		await firebase.updateBeforeVote(name, players[name].vote ?? null);
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
async function recordBeforeVoteSnapshot(players){
	if(!players) return;
	for(const name in players){
		await firebase.updateBeforeVote(name, players[name].beforeVote ?? null);
	}
}

// 生存者全員の投票をクリアする関数
async function clearVotesForAlive(players){
	for(const [name] of getAlivePlayers(players)){
		await firebase.updateVote(name, null);
	}
}

// 再投票の開始処理, revoteCountをインクリメント
async function startRevote(players){
	//await updateBeforeVoteForAll(players);
	await clearVotesForAlive(players);
	await firebase.updateAllIsDone(false);
	await firebase.incrementRevoteCount();
}

// プレイヤーを殺す関数
async function killPlayer(name){
	if(!name) return;
	await firebase.updateAlive(name, false);
}

// 投票の集計関数、voterFilterは投票者をフィルタリングする関数、(name, player) => booleanの形式
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

//　夜の処理の関数
async function resolveNightPhase(settings, players, date){
	const firstNightKill = settings.firstNightKill ?? false;
	const randomKillSameVote = settings.randomKillSameVote ?? true;

	// 初日の夜の処理、「初日の夜は人狼の襲撃オフ」のときはなし
	const isFirstNight = Number(date) === 0;
	if(!firstNightKill && isFirstNight){
		//await updateBeforeVoteForAll(players);
		await clearVotesForAlive(players);
		await firebase.resetRevoteCount();
		await firebase.updateTime(true);
		return;
	}

	const wolfVoteCounts = countVotes(players, (_name, player) => Number(player.role) === 1);
	const targets = getTopTargets(wolfVoteCounts);

	if(targets.length === 0){
		await startRevote(players);
		return;
	}

	if(targets.length !== 1){
		if(randomKillSameVote){
			const randomTarget = pickRandomTarget(targets);
			await killPlayer(randomTarget);
			await clearVotesForAlive(players);
			await firebase.resetRevoteCount();
			await firebase.updateTime(true);
			return;
		}

		await startRevote(players);
		return;
	}

	await killPlayer(targets[0]);
	//await updateBeforeVoteForAll(players);
	await clearVotesForAlive(players);
	await firebase.resetRevoteCount();
	await firebase.updateTime(true);
}

async function resolveDayPhase(settings, players, date){
	const randomKillSameVote = settings.randomKillSameVote ?? false;
	const dayVoteCounts = countVotes(players, () => true);
	const targets = getTopTargets(dayVoteCounts);

	if(targets.length !== 1){
		if(randomKillSameVote){
			const randomTarget = pickRandomTarget(targets);
			await killPlayer(randomTarget);
			await clearVotesForAlive(players);
			await firebase.resetRevoteCount();
			await firebase.updateDate(Number(date) + 1);
			await firebase.updateTime(false);
			return;
		}
		await startRevote(players);
		return;
	}

	await killPlayer(targets[0]);
	//await updateBeforeVoteForAll(players);
	await clearVotesForAlive(players);
	await firebase.resetRevoteCount();
	await firebase.updateDate(Number(date) + 1);
	await firebase.updateTime(false);
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
export function goNextPhase(){
	firebase.getAllDataOnce(async (Data)=>{
		if(!Data || !Data.game || !Data.players){
			throw new Error("ゲームデータが不完全です");
		}

		const phasePlayers = createPhaseSnapshot(Data.players);
		await recordBeforeVoteSnapshot(phasePlayers);

		const date = normalizeDate(Data.game.date);
		const isDay = normalizeTime(Data.game.time);

		if(isDay === null || date === null) return;

		if(!isDay){
			await resolveNightPhase(settings, phasePlayers, date);
			return;
		}

		await resolveDayPhase(settings, phasePlayers, date);
	});
}