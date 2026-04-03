// ui.js

//　変数の定義
export const roles = [
	{ name: "市民", id: "citizen-count", type: "display", number: 0, team:1 },
	{ name: "人狼", id: "count1", type: "input", number: 1, team:2 },
	{ name: "占い師", id: "count2", type: "input", number: 2, team:1 },
	{ name: "狂人", id: "count3", type: "input", number: 3, team:2 }
];

export let roleAreaHidden = false;
export let roleHidden = false;

// テキスト変換
export function statusToText(isConnected){
	if(isConnected === null) return "接続します...";
	return isConnected ? "接続しました！" : "接続待ち...";
}

export function roleToText(role){
	if(role === null) return "参加前";
	if(role === -1) return "未決定";
	if(role >= 0 && role < roles.length) return roles[role].name;
	return "未定義";
}

export function aliveToText(alive){
	if(alive === null) return "参加前";
	return alive ? "生存" : "死亡";
}

export function isDoneToText(isDone){
	if(isDone === null) return "参加前";
	return isDone ? "行動済み" : "未行動";
}

export function dateToText(date){
	if(date === null) return "開始前";
	return `${date}日目`;
}

export function timeToText(date){
	if(date === null) return "開始前";
	return date ? "昼" : "夜";
}

export function teamToText(team){
	switch(team){
		case null: return "開始前";
		case 0: return "試合中";
		case 1: return "市民陣営";
		case 2: return "人狼陣営";
		default: return "未定義";
	}
}

export function roleActionToText(role){
	switch(role){
		case 1: return "誰を襲撃しますか？";
		case 2: return "誰を占いますか？";
		default: return "怪しいと思う人を選んでください";
	}
}

export function roleActionButtonText(role){
	switch(role){
		case 1: return "襲撃";
		case 2: return "占い";
		default: return "怪しむ";
	}
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

export function setNowRole(nowRoles){
	let i = 0;
	document.getElementById('nowroles').innerText = "";
	for(const role of nowRoles){
		document.getElementById('nowroles').innerText += roleToText(i) + ": " + role + "人\n";
		i++;
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
		el.innerHTML += `<div>${name}: ${roleToText(player.role)}, ${aliveToText(player.alive)}, ${isDoneToText(player.isDone)}</div>`;
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

export function setTime(isDay){
	document.getElementById('time-display').innerText = timeToText(isDay);
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

export function setDayAction(text){
	document.getElementById('action-display').innerText = text;
}

export function setNightAction(role){
	document.getElementById('action-display').innerText = roleActionToText(role);
}

export function setActionButtonText(text){
	document.getElementById('btn-action').innerText = text;
}

export function setScore(score){
	document.getElementById('score-display').innerText = score;
}

//　役職設定の表示
export function createRoleCounters(containerId){


	const container = document.getElementById(containerId);
	container.innerHTML = ""; // 初期化

	roles.forEach(role => {
		const div = document.createElement("div");
		div.className = "counter";

		if(role.type === "display"){
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
export function viewVoteList(players) {
	document.getElementById('vote-list').innerHTML = "";
	if(!players) return;
	const options = Object.keys(players).filter(name => players[name].alive && name !== document.getElementById('name-display').innerText);
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
		if (index === 0) radio.checked = true; // 最初の要素を初期選択にする

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