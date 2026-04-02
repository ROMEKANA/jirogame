import * as ui from "./ui.js";
import * as game from "./game.js";
import * as firebase from "./firebase.js";

// 名前復元
const savedname = localStorage.getItem('wolf_my_name');
let savedrole = null;
if(savedname){
	ui.setUserName(savedname);
	ui.setNameDisplay(savedname);
	firebase.getRole(savedname, (role)=>{
		ui.setRole(role);
		savedrole = role;
	});
}

//　表示
// 接続状態の表示
let isConnected = null;
firebase.watchConnection((connected)=>{
	ui.setStatus(connected);
	isConnected = connected;
});

// 役職設定の表示
ui.createRoleCounters("role-counter");

// 全員のプレイヤー名表示, 投票リスト表示
firebase.watchAllPlayers((players)=>{
	ui.viewAllPlayers(players);
	ui.viewVoteList(players);
	//ui.viewAlivePlayers(players);
});

// プレイヤー数表示
firebase.watchCountPlayers((count)=>{
	ui.setPlayerCount(count);
	// 市民の数計算
	ui.setupRoleInputs(count);
	ui.updateCitizenDisplay(count);
});

// 日数の表示、次へ進めるボタン変更
firebase.watchDate((date)=>{
	ui.setDate(date);

	if(date !== null){
		ui.setNextButtonText("次のフェーズへ");
	}else{
		ui.setNextButtonText("ゲームスタート");
	}
	//console.log("日数が更新されました: " + date);
});

// 時間帯の表示, 行動の表示、行動ボタンのテキスト変更
firebase.watchTime((time)=>{
	ui.setTime(time);
	if(time == null){
		ui.setDayAction("ゲーム開始までお待ちください");
	}else if(time){
		ui.setDayAction("昼になりました。話し合いをしてください");
		ui.setActionButtonText("投票");
	}else{
		ui.setNightAction(savedrole);
		ui.setActionButtonText(ui.roleActionButtonText(savedrole));
	}
});

// 生存者数表示
firebase.watchCountAlivePlayers((count)=>{
	ui.setAliveCount(count);
});

// 勝利陣営の表示
firebase.watchWinner((winner)=>{
	ui.setWinner(winner);
	if(winner !== null && winner !== 0){
		alert(ui.teamToText(winner) + "の勝利です！");
	}
});

// 役職の表示
firebase.watchRole(savedname, (role)=>{
	ui.setRole(role);
	savedrole = role;

	console.log("役職が更新されました: " + role);
	//console.log(localStorage.getItem('wolf_my_name'));
	if(role !== null && role >= 0){
	alert("役職が割り当てられました。\n\
		あなたの役職は " + ui.roleToText(role) + " です");
	}
});

//　ボタン
// 参加ボタン
ui.onJoinClick(()=>{

	if(!isConnected){
		alert("接続されていません");
		return;
	}
	if(!firebase.getDate() === null){
		alert("ゲーム中には参加できません");
		return;
	}
	const name = ui.getUserName();
	if(!name){
		alert("名前を入力してね");
		return;
	}
	localStorage.setItem('wolf_my_name', name);
	ui.setNameDisplay(name);
	firebase.addPlayer(name).then(()=>{
		alert(name + "さん、参加完了！");
		firebase.watchRole(name, (role)=>{
			ui.setRole(role);
		});
	});
});

// 役職配布
ui.onAssignClick(()=>{
	if(!firebase.getDate() === null){
		alert("ゲーム中には役職を配布できません");
		return;
	}

	game.assignRoles();
});

// 次へ進めるボタン
ui.onGameNextClick(()=>{
	console.log("次へ進むボタンがクリックされました: " + firebase.getDate());
	if(firebase.getDate() === null || firebase.getWinner() === undefined){
		console.log("ゲーム開始");
		firebase.newGame();
	}else{
		game.checkWinner((winner)=>{
			if(winner === 0){
				firebase.nextPhase();
			}
		});
	}
});

// 全データ取得
ui.AllgetClick(async ()=>{
    const data = await firebase.getAllData();
    console.log(data);
	console.log("localname: " + localStorage.getItem('wolf_my_name'));
});

//全データ削除
ui.onAllDeleteClick(async ()=>{
	if(confirm("全データを削除しますか？")){
		await firebase.deleteAllData();
		localStorage.removeItem('wolf_my_name');
		alert("全データを削除しました");
	}
});