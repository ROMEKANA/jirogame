// ui.js

// テキスト変換
export function roleToText(role){
	switch(role){
		case 0: return "未決定";
		case 1: return "市民";
		case 2: return "人狼";
		case 3: return "占い師";
		case 4: return "狂人";
		default: return false;
	}
}

export function aliveToText(alive){
	return alive ? "生存" : "死亡";
}

export function isDoneToText(isDone){
	return isDone ? "行動済み" : "未行動";
}

export function timeToText(date){
	return date ? "昼" : "夜";
}

export function winnerToText(winner){
	switch(winner){
		case 0: return "試合中";
		case 1: return "市民陣営";
		case 2: return "人狼陣営";
		default: return "未定義";
	}
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

export function onActionClick(callback){
	document.getElementById('btn-action').addEventListener('click', callback);
}

export function onNextClick(callback){
	document.getElementById('btn-next').addEventListener('click', callback);
}

export function onPlayerDeleteClick(callback){
	document.getElementById('btn-playerdelete').addEventListener('click', callback);
}

export function AllgetClick(callback){
    document.getElementById('btn-allget').addEventListener('click', callback);
}

export function onAllDeleteClick(callback){
	document.getElementById('btn-alldelete').addEventListener('click', callback);
}

// テキストセット
export function setStatus(text){
	const el = document.getElementById('status');
	el.innerText = text;
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

export function setPlayerCount(count){
	document.getElementById('player-count').innerText = count;
}

export function viewAlivePlayers(players){
	const el = document.getElementById('alive-list');
	el.innerHTML = "";
	for(const name in players){
		const player = players[name];
	//el.innerHTML += `<div>${name}: ${roleToText(player.role)}</div>`;
	}
}

export function setDaycount(count){
	document.getElementById('day-count').innerText = count;
}

export function setTime(isDay){
	document.getElementById('time-display').innerText = timeToText(isDay);
}

export function setAliveCount(count){
	document.getElementById('alive-count').innerText = count;
}

export function setRole(role){
	document.getElementById('role-display').innerText =
		roleToText(role);
}

export function setAction(text){
	document.getElementById('action-display').innerText = text;
}

export function setScore(score){
	document.getElementById('score-display').innerText = score;
}

//投票先表示
export function viewVoteList(players) {
	if(!players) return;
	const options = Object.keys(players).filter(name => players[name].alive && name !== document.getElementById('name-display').innerText);
	const container = document.getElementById('vote-list');

	// 1. 配列をループして要素を作成
	options.forEach((item, index) => {
		// ラベル要素の作成
		const label = document.createElement('label');

		// ラジオボタン本体の作成
		const radio = document.createElement('input');
		radio.type = 'radio';
		radio.name = 'fruit'; // 同じname属性にすることでグループ化される
		radio.value = item;
		if (index === 0) radio.checked = true; // 最初の要素を初期選択にする

		// 組み立て
		label.appendChild(radio);
		label.appendChild(document.createTextNode(item));

		// コンテナに追加
		container.appendChild(label);
		container.appendChild(document.createElement('br')); // 改行用
	});

	// 2. 選択されている値を取得する関数
	function checkValue() {
		const selected = document.querySelector('input[name="fruit"]:checked');
		alert(selected ? `選択中: ${selected.value}` : '未選択です');
	}
}




