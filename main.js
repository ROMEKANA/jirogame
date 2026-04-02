import * as ui from "./ui.js";
import * as game from "./game.js";
import * as firebase from "./firebase.js";

// 名前復元
const savedname = localStorage.getItem('wolf_my_name');
if(savedname){
	ui.setUserName(savedname);
	ui.setNameDisplay(savedname);
	firebase.watchRole(savedname, (role)=>{
		ui.setRole(role);
		localStorage.setItem('wolf_my_role', role);
	});
}

//　表示
// 接続状態の表示
let isConnected = null;
firebase.watchConnection((connected)=>{
	ui.setStatus(ui.statusToText(connected));
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
	localStorage.setItem('wolf_day_count', date);
	ui.setDate(date);

	if(date !== null){
		ui.setNextButtonText("次のフェーズへ");
	}else{
		ui.setNextButtonText("ゲームスタート");
	}
	//console.log("日数が更新されました: " + date);
});

// 時間帯の表示
firebase.watchTime((time)=>{
	ui.setTime(time);
});

// 生存者数表示
firebase.watchCountAlivePlayers((count)=>{
	ui.setAliveCount(count);
});

// 勝利陣営の表示
firebase.watchWinner((winner)=>{
	ui.setWinner(winner);
});

//　ボタン
// 参加ボタン
ui.onJoinClick(()=>{

	if(!isConnected){
		alert("接続されていません");
		return;
	}
	if(firebase.getDate() === 0&&!firebase.getTime()){
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
	game.assignRoles();

	alert("役職を配りました！");
});

// 全データ取得
ui.AllgetClick(async ()=>{
    const data = await firebase.getAllData();
    console.log(data);
});

//全データ削除
ui.onAllDeleteClick(async ()=>{
	if(confirm("全データを削除しますか？")){
		await firebase.deleteAllData();
		alert("全データを削除しました");
	}
	firebase.newGame();
});