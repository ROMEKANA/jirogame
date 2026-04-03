import { db } from "./firebaseset.js";
import { ref, set, onValue, update, get} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


// 接続の監視
export function watchConnection(callback){
	onValue(ref(db, '.info/connected'), (snap)=>{
		callback(snap.val());
	});
}

/*
export function getConnectionStatus(){
	onValue(ref(db, '.info/connected'), (snap)=>{
		return snap.val();
	}, { onlyOnce: true });
}
*/

// 全データの取得と削除
export async function getAllData(){
	const snap = await get(ref(db, "/"));
	return snap.val();
}

export function getAllDataOnce(callback){
	onValue(ref(db, "/"), (snapshot)=>{
		callback(snapshot.val());
	}, { onlyOnce: true });
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

export async function deletePlayer(name){
	await set(ref(db, 'players/' + name), null);
}

export function getisPlayerExist(name, callback){
	onValue(ref(db, 'players/' + name), (snapshot)=>{
		callback(snapshot.exists());
	}, { onlyOnce: true });
}

//　すべてのプレイヤーのデータを取得
export function getAllPlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		callback(snapshot.val());
	}, { onlyOnce: true });
}

export function watchAllPlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		callback(snapshot.val());
	});
}

/*
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
*/

export function watchCountPlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		const count = players ? Object.keys(players).length : 0;
		callback(count);
	});
}

export function watchCountAlivePlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		let count = 0;
		for(const name in players){
			if(players[name].alive) count++;
		}
		callback(count);
	});
}

export function getCountAlivePlayers(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		let count = 0;
		for(const name in players){
			if(players[name].alive) count++;
		}
		callback(count);
	}, { onlyOnce: true });
}

// 役職
export async function updateRole(name, inputrole){
	await update(ref(db, 'players/' + name), {
		role: inputrole
	});
}

export async function updateAllRole(inputrole){
	const snapshot = await get(ref(db, 'players'));
    const players = snapshot.val();

    for (const name in players) {
        await updateRole(name, inputrole);
    }
}

export function watchRole(name, callback){
	onValue(ref(db, 'players/' + name + '/role'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export function getRole(name, callback){
	onValue(ref(db, 'players/' + name + '/role'), (snapshot)=>{
		callback(snapshot.val());
	}, { onlyOnce: true });
}

export function getRoleCount(roleNumber, callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		let count = 0;
		for(const name in players){
			if(players[name].role === roleNumber) count++;
		}
		callback(count);
	}, { onlyOnce: true });
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

export function watchScore(name, callback){
	onValue(ref(db, 'players/' + name + '/score'), (snapshot)=>{
		callback(snapshot.val());
	});
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

    for (const name in players) {
        await updateIsDone(name, isDone);
	}
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

export function getAllIsDone(callback){
	onValue(ref(db, 'players'), (snapshot)=>{
		const players = snapshot.val();
		const isDonePlayers = {};
		for(const name in players){
			if(!players[name].isDone){
				return callback(false);
			}
		}		callback(true);
	}, { onlyOnce: true });
}

// 投票
export async function updateVote(name, vote){
	await update(ref(db, 'players/' + name), {
		vote: vote
	});
}

export function watchVote(name, callback){
	onValue(ref(db, 'players/' + name + '/vote'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function updateBeforeVote(name, vote){
	await update(ref(db, 'players/' + name), {
		beforeVote: vote
	});
}

export function watchBeforeVote(name, callback){
	onValue(ref(db, 'players/' + name + '/beforeVote'), (snapshot)=>{
		callback(snapshot.val());
	});
}

// ゲームのデータ
export async function newGame(){
	await updateAllAlive(true);
	await updateAllIsDone(false);
	await set(ref(db, 'game'), {
		date: 0,
		time: false,
		winner: 0
	});
}

export function getGame(callback){
	onValue(ref(db, 'game'), (snapshot)=>{
		callback(snapshot.val());
	}, { onlyOnce: true });
}

export async function deleteGame(){
	await set(ref(db, 'game/date'), null);
	await set(ref(db, 'game/time'), null);
	//await set(ref(db, 'game/winner'), null);
	return;
}

// 日数
export async function updateDate(inputdate){
	await set(ref(db, 'game/date'), {
		date: inputdate
	});
}

export function watchDate(callback){
	onValue(ref(db, 'game/date'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export function getDate(callback){
	onValue(ref(db, 'game/date'), (snapshot)=>{
		//console.log("getDate: " + snapshot.val());
		callback(snapshot.val());
	}, { onlyOnce: true });
}

// 昼夜
export async function updateTime(inputtime){
	await set(ref(db, 'game/time'), {
		time: inputtime
	});
}

export function watchTime(callback){
	onValue(ref(db, 'game/time'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export async function getTime(callback){
	onValue(ref(db, 'game/time'), (snapshot)=>{
		callback(snapshot.val());
	}, { onlyOnce: true });
}

/*
// 次へ進める
export function nextPhase(){
	onValue(ref(db, 'game'), (snapshot)=>{
		const game = snapshot.val();
		if(!game.time){
			updateTime(true);
			updateDate(game.date + 1);
		}else{
			updateTime(false);
		}			
	}, { onlyOnce: true });
}
*/

// 勝敗
export async function updateWinner(inputwinner){
	await updateAllRole(-1);
	await set(ref(db, 'game/'), {
		date: null,
		time: null,
		winner: inputwinner
	});
}

export function watchWinner(callback){
	onValue(ref(db, 'game/winner'), (snapshot)=>{
		callback(snapshot.val());
	});
}

export function getWinner(callback){
	onValue(ref(db, 'game/winner'), (snapshot)=>{
		callback(snapshot.val());
	}, { onlyOnce: true });
}