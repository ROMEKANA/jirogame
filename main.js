import * as ui from "./ui.js";
import * as game from "./game.js";
import * as firebase from "./firebase.js";
import * as role from "./role.js";
import * as display from "./display.js";

// テスト用
window.test = {
	firebase: firebase,
	ui: ui,
	game: game,
	display: display,
	role: role
};

let farstconnectRole = true;
let savedRole = null;

let farstconnectWinner = true;
let savedWinner = null;

let farstconnectAlive = true;
let savedAlive = null;

let farstconnectRevote = true;
let savedRevote = null;

// 名前復元
let savedname = localStorage.getItem('wolf_my_name');

if (savedname) {
	ui.setUserName(savedname);
	ui.setNameDisplay(savedname);
}

// 接続状態の表示
let isConnected = false;
firebase.watchConnection((connected) => {
	ui.setStatus(connected);
	isConnected = connected;
});

let latestPlayers = await firebase.getAllPlayers();
let latestGameData = await firebase.getGame();
let latestSettings = await firebase.getSettings();

// 役職設定の入力欄の生成
ui.createRoleCounters("role-counter");

// 投票の選択肢の生成
function renderVoteList(players) {
	const voteOptions = Object.keys(players).filter(name => players[name].alive && name != savedname);

	const handleVoteSelect = async (name) => {
		await firebase.updateVote(savedname, name);
		await firebase.updateIsDone(savedname, true);
	};

	ui.viewVoteList(voteOptions, handleVoteSelect);
}

// プレイヤーの役職の表示の可否をゲームデータと設定から照らし合わせて取得
function shouldViewAllPlayersRole(players) {
	let isViewAllPlayersRole = !!latestGameData?.viewRoles;
	if (!isViewAllPlayersRole && savedname && Object.prototype.hasOwnProperty.call(players, savedname)) {
		const playerIsAlive = players[savedname]?.alive ?? true;
		if (!playerIsAlive && !!latestSettings?.revealRoleOnDeath) {
			isViewAllPlayersRole = true;
		}
	}
	return isViewAllPlayersRole;
}

// プレイヤーの役職の表示の更新
function refreshPlayerListVisibility() {
	if (!latestPlayers) return;
	ui.viewAllPlayers(shouldViewAllPlayersRole(latestPlayers), latestPlayers);
}

// プレイヤー情報からの表示
firebase.watchAllPlayers(async (players) => {
	if (players) {
		latestPlayers = players;
		ui.viewAllPlayers(shouldViewAllPlayersRole(players), players);

		ui.viewScoreList(players);
		ui.setNowRole(players);
		if (savedname) {
			renderVoteList(players);
		}


		const count = players ? Object.keys(players).length : 0;
		ui.setPlayerCount(count);
		ui.setupRoleInputs(count);
		ui.updateCitizenDisplay(count);

		const countAlive = players ? Object.values(players).filter(player => player && player.alive).length : 0;
		ui.setAliveCount(countAlive);

		// 個人プレイヤーの表示
		if (savedname) {
			// 役職の表示と通知
			const player = players[savedname];
			ui.setRole(player?.role);
			
			if (farstconnectRole) {
				farstconnectRole = false;
				savedRole = player?.role;
			} else if (player?.role != null && player.role >= 0 && player.role != savedRole) {
				alert("役職が割り当てられました。\n\
			あなたの役職は " + ui.roleDisplayToText(player.role) + " です");
				savedRole = player.role;
			} else {
				savedRole = player?.role;
			}

			// 占いの結果の表示
			const voteRole = players[player?.beforeVote]?.role ?? null;
			const furtuneResaltText = await role.furtuneResultToText(player?.role, player?.beforeVote, voteRole, latestSettings);
			ui.setFortune(furtuneResaltText);

			const selectedPlayer = !!player?.isDone ? player?.vote : "未選択";
			ui.setSelectedPlayer(selectedPlayer);

			// 死亡時の通知
			if (farstconnectAlive) {
				farstconnectAlive = false;
				savedAlive = player?.alive;
			} else if (player?.alive != null && player.alive != savedAlive) {
				savedAlive = player.alive;
				if (!player.alive && player.role != -1) {
					alert("あなたは死亡しました。");
				}
			} else {
				savedAlive = player?.alive;
			}
		}
	}
});

// ゲームの状態からの表示
firebase.watchGame(async (gamedata) => {
	latestGameData = gamedata;
	refreshPlayerListVisibility();

	const timerStart = Number(gamedata?.timerStartAt);
	ui.setSharedTimerStartAt(timerStart);
	ui.renderSharedTimer();

	const isGamestarted = (gamedata.date != null && gamedata.date >= 0);
	const isExistPlayer = savedname ? await firebase.getIsPlayerExist(savedname) : false;

	ui.setDate(gamedata.date);

	if (isGamestarted) {
		ui.setNextButtonText("次のフェーズへ");
	} else {
		ui.setNextButtonText("ゲームスタート");
	}

	ui.setisDaytime(gamedata.isDaytime);

	if(gamedata.isDaytime ?? true){
		display.resetMode();
	} else {
		display.setDarkMode();
	}

	if (!isExistPlayer) {
		ui.setAction("参加していません");
	} else {
		if (!isGamestarted) {
			ui.setAction("ゲーム開始までお待ちください");
		} else {
			const actionText = await role.actionToText(savedname, gamedata);
			ui.setAction(actionText);
		}
	}

	// 勝利陣営の通知
	ui.setWinner(gamedata.winner);
	if (farstconnectWinner) {
		farstconnectWinner = false;
		savedWinner = gamedata.winner;
	} else if (gamedata.winner != null && gamedata.winner != 0 && gamedata.winner != savedWinner) {
		alert(ui.teamToText(gamedata.winner) + "の勝利です！");
		savedWinner = gamedata.winner;
	} else {
		savedWinner = gamedata.winner;
	}

	// 同数投票の再投票の通知

	if (farstconnectRevote) {
		farstconnectRevote = false;
		savedRevote = gamedata.revoteCount;
	} else if (gamedata.revoteCount != null && gamedata.revoteCount > 0) {
		if (gamedata.revoteCount != savedRevote) {
			alert("同数投票のため、再投票が行われます");
			savedRevote = gamedata.revoteCount;
		}
	} else {
		savedRevote = 0;
	}
});

// 設定の表示
firebase.watchSettings((settings) => {
	latestSettings = settings;

	refreshPlayerListVisibility();

	ui.setSettings(settings);
	const discussionMin = Number(settings?.discussionTime) || 5;
	const timerDurationSec = Number.isFinite(discussionMin) && discussionMin > 0
		? Math.floor(discussionMin * 60)
		: 0;
	ui.setSharedTimerDurationSec(timerDurationSec);
	ui.renderSharedTimer();
});

ui.startSharedTimerLoop();

//　ボタン
// 参加ボタン
ui.onJoinClick(async () => {
	if (!isConnected) {
		alert("接続されていません");
		return;
	}

	const name = (ui.getUserName() || "").trim();
	if (!name) {
		alert("名前を入力してね");
		return;
	}

	const exists = await firebase.getIsPlayerExist(name);
	localStorage.setItem('wolf_my_name', name);
	savedname = name;
	ui.setNameDisplay(name);

	if (exists) {
		alert(name + "さんとして再参加しました、うまく表示されないときはリロードしてください");
		return;
	}

	const isGamestarted = await game.isGameStarted();
	if (isGamestarted) {
		alert("ゲーム中には参加できません");
		return;
	}

	await firebase.addPlayer(name);
	alert(name + "さん、参加完了！");

});

// 役職配布
ui.onAssignClick(async () => {
	const started = await game.isGameStarted();
	if (started) {
		alert("ゲーム中には役職を配布できません");
		return;
	}
	else {
		await firebase.updateAllAlive(true);
		await game.assignRoles();
	}
});

// 役職エリアの表示切替
ui.onRoleAreaHiddenClick(() => {
	const roleArea = document.getElementById("role-assign");
	if (roleArea.style.display === "none") {
		roleArea.style.display = "block";
		ui.setRoleHiddenButtonText(false);
	} else {
		roleArea.style.display = "none";
		ui.setRoleHiddenButtonText(true);
	}
});

// 管理者エリアの表示切替
ui.onAdminAreaHiddenClick(() => {
	const adminArea = document.getElementById("btn-area");
	const isHidden = adminArea.style.display === "none";

	adminArea.style.display = isHidden ? "inline" : "none";
	ui.setAdminAreaHiddenButtonText(!isHidden);
});

// テスト用ボタンの表示切替
ui.onTestToolsToggleClick(() => {
	const testTools = document.getElementById("test-tools");
	const toggleButton = document.getElementById("btn-testtools-toggle");
	const isHidden = testTools.style.display === "none";

	testTools.style.display = isHidden ? "block" : "none";
	toggleButton.innerText = isHidden ? "テスト用ボタンを隠す" : "テスト用ボタンを表示";
});

// 次へ進めるボタン
ui.onGameNextClick(async () => {
	const players = await firebase.getAllPlayers();
	if (!players) {
		alert("プレイヤーがいません");
		return;
	}

	const undecidedCount = await firebase.getRoleCount(-1);
	if (undecidedCount > 0) {
		alert("全員に役職が配布されていません");
		return;
	}

	const isGameStarted = await game.isGameStarted();
	if (!isGameStarted) {
		await firebase.newGame();
		return;
	}

	let allDone = await firebase.getAllIsDone();
	const AllData = await firebase.getAllData();

	allDone = allDone ? await firebase.getAllIsDone() : false;

	if (!allDone) {
		alert("全員が行動を完了していません");
		return;
	}

	await firebase.updateAllIsDone(false);
	const winner = await game.checkWinner(AllData.game.isDaytime, AllData.players);
	if (winner == 0) {
		await game.goNextPhase(AllData);
	}
	await firebase.updateTimerStartAt(Date.now());
});

ui.onTimerResetClick(async () => {
	await firebase.updateTimerStartAt(Date.now());
});

// ゲームのリセット
ui.onResetbtnClick(async () => {
	if (confirm("ゲームをリセットしますか？")) {
		await firebase.updateWinner(-1);
	}
});

// 全員のスコアリセット
ui.onScoreResetClick(async () => {
	if (confirm("全員のスコアを0にリセットしますか？")) {
		await firebase.resetAllScores();
		await firebase.deleteGame();
		alert("全員のスコアをリセットしました");
	}
});

// プレイヤー1人削除
ui.onPlayerDeleteClick(async () => {
	const deleteName = (ui.getDeleteName() || "").trim();
	if (!deleteName) {
		alert("削除する名前を入力してください");
		return;
	}

	const exists = await firebase.getIsPlayerExist(deleteName);
	if (!exists) {
		alert("その名前のプレイヤーはいません");
		return;
	}

	if (!confirm(deleteName + " を削除しますか？")) {
		return;
	}

	await firebase.deletePlayer(deleteName);

	// 削除したプレイヤーが自分だったとき、ローカルストレージからも削除
	if (savedname == deleteName) {
		localStorage.removeItem('wolf_my_name');
		savedname = null;
		ui.setNameDisplay("未参加");
		ui.setRole(null);
	}
	alert(deleteName + " を削除しました");
});

// 一日進める（テスト用）
ui.onDayAheadClick(async () => {
	const isGameStarted = await game.isGameStarted();
	if (!isGameStarted) {
		alert("ゲーム開始後に実行してください");
	} else {
		let isDaytime = await firebase.getIsDaytime();
		await firebase.updateIsDaytime(!isDaytime);
		if (!isDaytime){
			let date = await firebase.getDate();
			await firebase.updateDate(date + 1);
		}
		alert("日数を進めました");
	}
});

// ランダムに1人死亡（テスト用）
ui.onRandomKillClick(async () => {
	const players = await firebase.getAllPlayers();
	if (!players) {
		alert("プレイヤーがいません");
		return;
	}

	const aliveNames = Object.keys(players).filter((name) => players[name]?.alive);
	if (aliveNames.length == 0) {
		alert("生存者がいません");
		return;
	}

	const randomIndex = Math.floor(Math.random() * aliveNames.length);
	const target = aliveNames[randomIndex];
	await firebase.updateAlive(target, false);
	alert(target + " を死亡にしました");
});

// 全データ取得
ui.AllgetClick(async () => {
	const data = await firebase.getAllData();
	console.log(data);
	console.log("localname: " + localStorage.getItem('wolf_my_name'));
});

//全データ削除
ui.onAllDeleteClick(async () => {
	if (confirm("全データを削除しますか？")) {
		await firebase.deleteAllPlayers();
		await firebase.deleteGame();
		await firebase.newSettings();
		localStorage.removeItem('wolf_my_name');
		alert("全データを削除しました");
	}
});