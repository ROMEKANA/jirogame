import { roles, teams, roleActionToText, roleActionButtonText } from "./role.js";

export let roleAreaHidden = false;
export let roleHidden = false;

// テキスト変換 いつか消す
export function statusToText(isConnected){
	if(isConnected == null) return "接続します...";
	return isConnected ? "接続しました！" : "接続待ち...";
}

export function roleToText(role){
	if(role == null) return "参加前";
	if(role == -1) return "未決定";
	if(role >= 0 && role < roles.length) return roles[role].name;
	return "未定義";
}

export function aliveToText(alive){
	if(alive == null) return "参加前";
	return alive ? "生存" : "死亡";
}

export function isDoneToText(isDone){
	if(isDone == null) return "参加前";
	return isDone ? "行動済み" : "未行動";
}

export function dateToText(date){
	if(date == null) return "開始前";
	if(typeof date == "object" && date != null && "date" in date){
		return `${date.date}日目`;
	}
	return `${date}日目`;
}

export function isDaytimeToText(date){
	if(date == null) return "開始前";
	if(typeof date == "object" && date != null && "isDaytime" in date){
		return date.isDaytime ? "昼" : "夜";
	}
	return date ? "昼" : "夜";
}

export function teamToText(team){
	if(team == null) return "開始前";
	if(team >= 0 && team < teams.length) return teams[team].name;
	return "未定義";
}

// テキストセット
export function setStatus(isConnected){
	const el = document.getElementById('status');
	el.innerText = statusToText(isConnected);
}

export function setUserName(name){
	document.getElementById('userName').value = name;
}

export function setNameDisplay(name){
	document.getElementById('name-display').innerText = name;
}

export function citizenCount(playerCount){
	const inputs = document.querySelectorAll('.value');

	let total = 0;
	inputs.forEach(input => {
		total += Number(input.value);
	});

	return playerCount - total;
}

export function updateCitizenDisplay(playerCount){
	const count = citizenCount(playerCount);
	document.getElementById('citizen-count').innerText = count;
}

export function setupRoleInputs(playerCount){
	const inputs = document.querySelectorAll('.value');

	inputs.forEach(input => {
		input.addEventListener('input', () => {
			updateCitizenDisplay(playerCount);
		});
	});
}

export function setRoleHiddenButtonText(isHidden){
	document.getElementById('btn-roleareahidden').innerText = isHidden ? "設定を表示" : "設定を隠す";
}

export function setSettings(settings){
	const el = document.getElementById('settings-list');
	if(!settings){
		el.innerHTML = "設定がありません";
		return;
	}

	const labels = {
		firstNightAttack: "初夜の襲撃",
		revote: "同数投票時に再投票",
		randomKillSameVote: "夜の同数投票時にランダム襲撃",
		skipExecutionSameVote: "昼の同数投票時に処刑スキップ",
		discussionTime: "議論時間(分)",
		firstNightFortune: "初夜占い",
		firstNightRandomWhite: "初夜のランダム白出し",
		firstDayExecution: "初日の処刑",
		revealRoleOnDeath: "死亡時の役職公開",
	};

	const lines = [];
	for(const [key, value] of Object.entries(settings)){
		const label = labels[key] || key;
		let displayValue = value;
		if(typeof value === "boolean"){
			displayValue = value ? "ON" : "OFF";
		}
		lines.push(`<div>${label}: ${displayValue}</div>`);
	}

	el.innerHTML = lines.join("");
}

export function setNowRole(players){
	let nowRoles = [];
	for (const role of roles) {
		nowRoles[role.number] = 0;
	}
	for (const name in players) {
		const playerRoleNumber = players[name].role;
		if(playerRoleNumber != null && playerRoleNumber >= 0 && playerRoleNumber < nowRoles.length)
			nowRoles[playerRoleNumber]++;
	}

	document.getElementById('nowroles').innerText = "";

	for(let i = 0; i < nowRoles.length; i++){
		document.getElementById('nowroles').innerText += roleToText(i) + ": " + nowRoles[i] + "人\n";
	}
}

export function setPlayerCount(count){
	document.getElementById('player-count').innerText = count;
}

export function viewAllPlayers(players){
	if(!players) return;
	const playersArray = Object.entries(players)
		.sort((a, b) => {
			const PlayerA = a[1];
			const PlayerB = b[1];
			return (PlayerB.alive - PlayerA.alive);
		});
	const el = document.getElementById('player-list');
	el.innerHTML = "";
	for(const [name, player] of playersArray){
		//el.innerHTML += `<div>${name}</div>`;
		//el.innerHTML += `<div>${name}: ${roleToText(player.role)}, ${aliveToText(player.alive)}, ${isDoneToText(player.isDone)}</div>`;
		el.innerHTML += `<div>${name}: ${aliveToText(player.alive)}, ${isDoneToText(player.isDone)}</div>`;
	}
}

export function viewScoreList(players){
	const el = document.getElementById('score-list');
	if(!players){
		el.innerHTML = "表示できるスコアがありません";
		return;
	}

	const scoreArray = Object.entries(players)
		.map(([name, player]) => [name, Number(player?.score) || 0])
		.sort((a, b) => {
			if(b[1] != a[1]) return b[1] - a[1];
			return a[0].localeCompare(b[0], 'ja');
		});

	el.innerHTML = "";
	for(const [name, score] of scoreArray){
		el.innerHTML += `<div>${name}: ${score}点</div>`;
	}
}

// 使わない
export function viewAlivePlayers(players){
	const el = document.getElementById('alive-list');
	el.innerHTML = "現在の生存者：";
	for(const name in players){
		if(players[name].alive) {
			const player = players[name];
			el.innerHTML += `<div>${name}: ${roleToText(player.role)}</div>`;
		}
	}
}

export function setDate(count){
	document.getElementById('day-count').innerText = dateToText(count);
}

export function setisDaytime(isDay){
	document.getElementById('isDaytime-display').innerText = isDaytimeToText(isDay);
}

export function setAliveCount(count){
	document.getElementById('alive-count').innerText = count;
}

export function setWinner(winner){
	document.getElementById('winner-display').innerText = teamToText(winner);
}

export function setNextButtonText(text){
	document.getElementById('btn-next').innerText = text;
}

export function setRole(role){
	document.getElementById('role-display').innerText = roleToText(role);
}

export function setFortune(result){
	if(result == null || result == "") result = "占い結果がここに表示されます";
	document.getElementById('fortune-display').innerText = result;
}

export function setDayAction(text){
	document.getElementById('action-display').innerText = text;
}

export function setDayActionButtonText(text){
	document.getElementById('btn-action').innerText = text;
}

export function setNightAction(role){
	document.getElementById('action-display').innerText = roleActionToText(role);
	setDayActionButtonText(roleActionButtonText(role));
	//console.log("test: " + num + ui.roleActionToText(num));
}

//　役職設定の表示
export function createRoleCounters(containerId){

	const container = document.getElementById(containerId);
	container.innerHTML = ""; // 初期化

	roles.forEach(role => {
		const div = document.createElement("div");
		div.className = "counter";

		if(role.type == "display"){
			div.innerHTML = `
				${role.name}：
				<span id="${role.id}">0</span>人
			`;
		}else{
			div.innerHTML = `
				${role.name}：
				<input type="number" class="value" id="${role.id}" value="0" min="0">
			`;
		}

		container.appendChild(div);
	});
}

//投票先表示
export function viewVoteList(players, savedname){
	document.getElementById('vote-list').innerHTML = "";
	if(!players) return;
	const options = Object.keys(players).filter(name => players[name].alive && name != savedname);
	const container = document.getElementById('vote-list');

	// 配列をループして要素を作成
	options.forEach((item, index) => {
		// ラベル要素の作成
		const label = document.createElement('label');

		// ラジオボタン本体の作成
		const radio = document.createElement('input');
		radio.type = 'radio';
		radio.name = 'votename'; // 同じname属性にすることでグループ化される
		radio.value = item;
		if (index == 0) radio.checked = true; // 最初の要素を初期選択にする

		// 組み立て
		label.appendChild(radio);
		label.appendChild(document.createTextNode(item));

		// コンテナに追加
		container.appendChild(label);
		container.appendChild(document.createElement('br')); // 改行用
	});
}

// 選択されている値を取得する関数
export function getVote() {
	const selected = document.querySelector('input[name="votename"]:checked');
	//alert(selected ? `選択中: ${selected.value}` : '未選択です');
	return selected ? selected.value : null;
}

// テキスト入力受付
export function getUserName(){
	return document.getElementById('userName').value;
}

export function getDeleteName(){
	return document.getElementById('deleteName').value;
}

// ボタンクリック受付
export function onJoinClick(callback){
	document.getElementById('btn-join').addEventListener('click', callback);
}

export function onAssignClick(callback){
	document.getElementById('btn-assign').addEventListener('click', callback);
}

export function onRoleAreaHiddenClick(callback){
	document.getElementById('btn-roleareahidden').addEventListener('click', callback);
}

export function onGameNextClick(callback){
	document.getElementById('btn-next').addEventListener('click', callback);
}

export function onActionClick(callback){
	document.getElementById('btn-action').addEventListener('click', callback);
}

export function onScoreResetClick(callback){
	document.getElementById('btn-scorereset').addEventListener('click', callback);
}

export function onPlayerDeleteClick(callback){
	document.getElementById('btn-playerdelete').addEventListener('click', callback);
}

export function onDayAheadClick(callback){
	document.getElementById('btn-ahead').addEventListener('click', callback);
}

export function onRandomKillClick(callback){
	document.getElementById('randomkill').addEventListener('click', callback);
}

export function AllgetClick(callback){
    document.getElementById('btn-allget').addEventListener('click', callback);
}

export function onAllDeleteClick(callback){
	document.getElementById('btn-alldelete').addEventListener('click', callback);
	//localStorage.removeItem('wolf_my_name');
}

export function onTestToolsToggleClick(callback){
	document.getElementById('btn-testtools-toggle').addEventListener('click', callback);
}