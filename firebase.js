import { db } from "./firebaseset.js";
import { ref, set, onValue, update, get} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


// 接続の監視
export function watchConnection(callback){
	onValue(ref(db, '.info/connected'), (snap)=>{
		callback(snap.val());
	});
}

// 全データの取得と削除
export async function getAllDataOnce(){
	const snap = await get(ref(db, "/"));
	return snap.val();
}

export async function deleteAllData(){
	await set(ref(db, "/"), null);
}

// プレイヤーのデータ
// プレイヤーの追加
export function addPlayer(name){
	return set(ref(db, 'players/' + name), {
		role: 0,
		alive: true,
		isDone: true,
		vote: null,
		score: 0
	});
}

//　すべてのプレイヤーのデータを取得
export function watchPlayersOnce(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		callback(snapshot.val());
	}, { onlyOnce: true });
}

export function watchAllPlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export function watchAlivePlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		const alivePlayers = {};
		for(const name in players){
			if(players[name].alive){
				alivePlayers[name] = players[name];
			}
		}
		callback(alivePlayers);
	});
}

export function countPlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		const count = players ? Object.keys(players).length : 0;
		callback(count);
	});
}

export function countAlivePlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		let count = 0;
		for(const name in players){
			if(players[name].alive) count++;
		}
		callback(count);
	});
}

// 役職
export function updateRole(name, inputrole){
	return update(ref(db, 'players/' + name), {
		role: inputrole
	});
}

export function watchRole(name, callback){
	onValue(ref(db, 'players/' + name + '/role'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// 生死
export function updateAlive(name, alivebool){
	return update(ref(db, 'players/' + name), {
		alive: alivebool
	});
}

export function AllupdateAlive(alivebool){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		for(const name in players){
			updateAlive(name, alivebool);
		}
	});
}

export function watchAlive(name, callback){
	onValue(ref(db, 'players/' + name + '/alive'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// スコア
export function updateScore(name, score){
	return update(ref(db, 'players/' + name), {
		score: score
	});
}

export function addScore(name, addscore){
	onValue(ref(db, 'players/' + name + '/score'), (snapshot)=>{
		const currentScore = snapshot.val() || 0;
		updateScore(name, currentScore + addscore);
	});
}

export function watchScore(name, callback){
	onValue(ref(db, 'players/' + name + '/score'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// 行動完了
export function updateIsDone(name, isDone){
	return update(ref(db, 'players/' + name), {
		isDone: isDone
	});
}

export function AllupdateIsDone(isDone){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		for(const name in players){
			updateIsDone(name, isDone);
		}
	});
}

export function watchIsDone(name, callback){
	onValue(ref(db, 'players/' + name + '/isDone'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export function watchAllIsDone(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		const isDonePlayers = {};
		for(const name in players){
			if(!players[name].isDone){
				return callback(false);
			}
		}
		callback(true);
	});
}

// 投票
export function updateVote(name, vote){
	return update(ref(db, 'players/' + name), {
		vote: vote
	});
}

export function watchVote(name, callback){
	onValue(ref(db, 'players/' + name + '/vote'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// ゲームのデータ
export function newGame(){
	return set(ref(db, 'game'), {
		date: 0,
		time: false,
		winner: null
	});
}

// 日数
export function setDate(inputdate){
	return set(ref(db, 'game/date'), {
		date: inputdate
	});
}

export function watchDate(callback){
	onValue(ref(db, 'game/date'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// 昼夜
export function setTime(inputtime){
	return set(ref(db, 'game/time'), {
		time: inputtime
	});
}

export function watchTime(callback){
	onValue(ref(db, 'game/time'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// 勝敗
export function setWinner(inputwinner){
	return set(ref(db, 'game/winner'), {
		winner: inputwinner
	});
}

export function watchWinner(callback){
	onValue(ref(db, 'game/winner'), (snapshot)=>{
		callback(snapshot.val());
	});
}