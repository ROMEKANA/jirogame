import { db } from "./firebaseset.js";
import { ref, set, onValue, update, get} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 接続の監視
export function watchConnection(callback){
	onValue(ref(db, '.info/connected'), (snap)=>{
		callback(snap.val());
	});
}

// 全データの取得と削除
export async function getAllData(){
	const snap = await get(ref(db, "/"));
	return snap.val();
}

export async function deleteAllData(){
	await set(ref(db, "/"), null);
}

// プレイヤーのデータ
// プレイヤーの追加、削除、存在確認
export async function addPlayer(name){
	await set(ref(db, 'players/' + name), {
		role: -1,
		alive: false,
		isDone: true,
		vote: null,
		score: 0
	});
}

export async function getPlayer(name){
	const snapshot = await get(ref(db, 'players/' + name));
	return snapshot.val();
}

export async function deletePlayer(name){
	await set(ref(db, 'players/' + name), null);
}

export async function getIsPlayerExist(name){
	const snapshot = await get(ref(db, 'players/' + name));
	return snapshot.exists();
}

//　すべてのプレイヤーのデータ
export async function getAllPlayers(){
	const snapshot = await get(ref(db, 'players'));
	return snapshot.val();
}

export function watchAllPlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function getCountAlivePlayers(){
	const snapshot = await get(ref(db, 'players'));
	const players = snapshot.val();
	if(!players) return 0;
	let count = 0;
	for(const name in players){
		if(players[name].alive) count++;
	}
	return count;
}

export async function deleteAllPlayers(){
	await set(ref(db, 'players'), null);
}

// 役職
export async function updateRole(name, inputrole){
	await update(ref(db, 'players/' + name), {
		role: inputrole
	});
}

export async function updateAllRole(inputroles){
	const snapshot = await get(ref(db, 'players'));
    const players = snapshot.val();

    for (const name in players) {
        await updateRole(name, inputroles);
    }
}

export async function getRole(name){
	const snapshot = await get(ref(db, 'players/' + name + '/role'));
	return snapshot.val();
}

export async function getAliveRoleCount(roleNumber){
	const snapshot = await get(ref(db, 'players'));
	const players = snapshot.val();
	if(!players) return 0;
	let count = 0;
	for(const name in players){
		if(players[name].role === roleNumber && players[name].alive) count++;
	}
	return count;
}

export async function getRoleCount(roleNumber){
	const snapshot = await get(ref(db, 'players'));
	const players = snapshot.val();
	if(!players) return 0;
	let count = 0;
	for(const name in players){
		if(players[name].role === roleNumber) count++;
	}
	return count;
}

// 生死
export async function updateAlive(name, alivebool){
	await update(ref(db, 'players/' + name), {
		alive: alivebool
	});
}

export async function updateAllAlive(alivebool){
	const snapshot = await get(ref(db, 'players'));
    const players = snapshot.val();

    for (const name in players) {
        await updateAlive(name, alivebool);
    }
}

export function watchAlive(name, callback){
	onValue(ref(db, 'players/' + name + '/alive'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// スコア
export async function updateScore(name, score){
	await update(ref(db, 'players/' + name), {
		score: score
	});
}

export async function addScore(name, addscore){
	const snapshot = await get(ref(db, 'players/' + name + '/score'));
	const currentScore = snapshot.val() || 0;
	await updateScore(name, currentScore + addscore);
}

export async function resetAllScores(){
	const snapshot = await get(ref(db, 'players'));
	const players = snapshot.val();
	if(!players) return;

	for (const name in players) {
		await updateScore(name, 0);
	}
}

// 行動完了
export async function updateIsDone(name, isDone){
	await update(ref(db, 'players/' + name), {
		isDone: isDone
	});
}

export async function updateAllIsDone(isDone){
	const snapshot = await get(ref(db, 'players'));
	const players = snapshot.val();

	if(!players) return;

    for (const name in players) {
        await updateIsDone(name, isDone);
	}
}

export async function getAllIsDone(){
	const snapshot = await get(ref(db, 'players'));
	const players = snapshot.val();
	if(!players) return true;
	for(const name in players){
		const p = players[name];
		if(p && p.alive){
			if(!p.isDone){
				return false;
			}
		}
	}
	return true;
}

// 投票
export async function updateVote(name, vote){
	await update(ref(db, 'players/' + name), {
		vote: vote
	});
}

export async function updateBeforeVote(name, vote){
	await update(ref(db, 'players/' + name), {
		beforeVote: vote
	});
}

export async function deleteAllVotes(){
	const snapshot = await get(ref(db, 'players'));
	const players = snapshot.val();
	if(!players) return;

	for (const name in players) {
		await updateVote(name, null);
		await updateBeforeVote(name, null);
	}
}


// ゲームのデータ

export async function newGame(){
	await deleteAllVotes();
	await updateAllAlive(true);
	await updateAllIsDone(false);
	const randValue = Math.random();
	await set(ref(db, 'game'), {
		date: 0,
		isDaytime: false,
		winner: 0,
		revoteCount: 0,
		timerStartAt: Date.now(),
		rand : randValue,
		beforeExecution: null,
		viewRoles: false
	});
}

export async function getGame(){
	const snapshot = await get(ref(db, 'game'));
	return snapshot.val();
}

export function watchGame(callback){
	onValue(ref(db, 'game'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function deleteGame(){
	await set(ref(db, 'game'), {
		date: null,
		isDaytime: null,
		winner: null,
		revoteCount: 0,
		timerStartAt: null,
		rand : null,
		beforeExecution: null,
		viewRoles: true
	});
}

// タイマー
export async function updateTimerStartAt(inputStartAt){
	await set(ref(db, 'game/timerStartAt'), inputStartAt);
}

// 日数
export async function updateDate(inputdate){
	await set(ref(db, 'game/date'), inputdate);
}

export function watchDate(callback){
	onValue(ref(db, 'game/date'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function getDate(){
	const snapshot = await get(ref(db, 'game/date'));
	return snapshot.val();
}

// 昼夜
export async function updateIsDaytime(inputtime){
	await set(ref(db, 'game/isDaytime'), inputtime);
}

export function watchIsDaytime(callback){
	onValue(ref(db, 'game/isDaytime'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function getIsDaytime(){
	const snapshot = await get(ref(db, 'game/isDaytime'));
	return snapshot.val();
}

// 再投票の回数
export async function updateRevoteCount(count){
	await set(ref(db, 'game/revoteCount'), count);
}

export async function getRevoteCount(){
	const snapshot = await get(ref(db, 'game/revoteCount'));
	return snapshot.val();
}

export async function resetRevoteCount(){
	await updateRevoteCount(0);
}

export async function incrementRevoteCount(){
    const count = await getRevoteCount();
    await updateRevoteCount(count + 1);
}

// ランダムな数
export async function updateRand(){
	const rand = Math.random();
	await set(ref(db, 'game/rand'), rand);
}

export async function getRand(){
	const snapshot = await get(ref(db, 'game/rand'));
	return snapshot.val();
}

// 処刑された人の記録
export async function updateBeforeExecution(name){
	await set(ref(db, 'game/beforeExecution'), name);
}

export async function getBeforeExecution(){
	const snapshot = await get(ref(db, 'game/beforeExecution'));
	return snapshot.val();
}

// 勝敗
export async function updateWinner(inputwinner){
	if(inputwinner == null || inputwinner == 0) return;
	if(inputwinner < 0) inputwinner = null;
	await set(ref(db, 'game/'), {
		date: null,
		isDaytime: null,
		winner: inputwinner,
		revoteCount: 0,
		timerStartAt: null,
		rand: null,
		beforeExecution: null,
		viewRoles: true
	});
}

export function watchWinner(callback){
	onValue(ref(db, 'game/winner'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function getWinner(){
	const snapshot = await get(ref(db, 'game/winner'));
	return snapshot.val();
}

// プレイヤーリストの表示
export async function updateViewRole(isViewAllPlayersRole){
	await set(ref(db, 'game/viewRoles'), isViewAllPlayersRole);
}

export async function getViewRole(){
	const snapshot = await get(ref(db, 'game/viewRoles'));
	return snapshot.val();
}

// ゲームの設定管理
// 初期設定
export async function getSettings(){
	const snapshot = await get(ref(db, 'settings'));
	return snapshot.val();
}

export function watchSettings(callback){
	onValue(ref(db, 'settings'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function newSettings(){
	await set(ref(db, 'settings'), {
		firstNightAttack: false,
		revote: true,
		randomKillSameVote: true,
		skipExecutionSameVote: true,
		discussionTime: 3,
		firstNightFortune: true,
		firstNightRandomWhite: false,
		firstDayExecution: false,
		revealRoleOnDeath: false
	});
}

export async function updateSetting(name, value){
	await set(ref(db, 'settings/' + name), value);
}