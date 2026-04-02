import * as ui from "./ui.js";
import * as game from "./game.js";
import * as firebase from "./firebase.js";

// 接続状態
firebase.watchConnection((connected)=>{
	if(connected){
		ui.setStatus("接続しました！");
	}else{
		ui.setStatus("接続待ち...");
	}
});

// 参加ボタン
ui.onJoinClick(()=>{
	const name = ui.getUserName();
	if(!name){
		alert("名前を入力してね");
		return;
	}

	localStorage.setItem('wolf_my_name', name);

	game.joinGame(name).then(()=>{
		alert(name + "さん、参加完了！");
		game.watchRole(name, (role)=>{
			ui.setRole(role);
		});
	});
});

// 役職配布
ui.onAssignClick(()=>{
	game.assignRoles();
});

// 名前復元
const saved = localStorage.getItem('wolf_my_name');
if(saved){
	ui.setUserName(saved);
	ui.setNameDisplay(saved);
	game.watchRole(saved, (role)=>{
		ui.setRole(role);
	});
}

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
});

// 全員のプレイヤー名表示, 投票リスト表示
firebase.watchAllPlayers((players)=>{
	ui.viewAllPlayers(players);
	ui.viewVoteList(players);
});

/*
// 生存者のプレイヤー名表示
firebase.watchAlivePlayers((players)=>{
	ui.viewAlivePlayers(players);
});
*/

// プレイヤー数表示
firebase.countPlayers((count)=>{
	ui.setPlayerCount(count);

	// 市民の数計算
	ui.setupRoleInputs(count);
	ui.updateCitizenDisplay(count);

	//console.log("playerCount:", count);
});


// 生存者数表示
firebase.countAlivePlayers((count)=>{
	ui.setAliveCount(count);
});