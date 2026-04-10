import { roles, teams } from "./role.js";
import * as display from "./display.js";

export let roleAreaHidden = false;
export let roleHidden = false;

let sharedTimerStartAt = null;
let sharedTimerDurationSec = 0;
let sharedTimerIntervalId = null;

// テキスト変換
export function roleToText(role){
	if(role == null) return "参加前";
	if(role == -1) return "未決定";
	if(role >= 0 && role < roles.length) return roles[role].name;
	return "未定義";
}

export function roleDisplayToText(role){
	if(role == null) return "参加前";
	if(role == -1) return "未決定";
	if(role >= 0 && role < roles.length) return roles[role].displayName ? roles[role].displayName : roles[role].name;
	return "未定義";
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

// タイマー作成
function formatTimerText(totalSec) {
	const safeSec = Math.max(0, totalSec | 0);
	const min = Math.floor(safeSec / 60);
	const sec = safeSec % 60;
	return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function setSharedTimerStartAt(timerStartAt) {
	const value = Number(timerStartAt);
	sharedTimerStartAt = Number.isFinite(value) && value > 0 ? value : null;
}

export function setSharedTimerDurationSec(timerDurationSec) {
	const value = Number(timerDurationSec);
	sharedTimerDurationSec = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function renderSharedTimer() {
	if (!(sharedTimerStartAt > 0) || !(sharedTimerDurationSec > 0)) {
		setTimerDisplay("--:--");
		return;
	}

	const elapsedSec = Math.floor((Date.now() - sharedTimerStartAt) / 1000);
	const remainSec = Math.max(0, sharedTimerDurationSec - elapsedSec);
	setTimerDisplay(formatTimerText(remainSec));
}

export function startSharedTimerLoop() {
	if (sharedTimerIntervalId != null) return;
	renderSharedTimer();
	sharedTimerIntervalId = window.setInterval(renderSharedTimer, 250);
}

export function stopSharedTimerLoop() {
	if (sharedTimerIntervalId == null) return;
	window.clearInterval(sharedTimerIntervalId);
	sharedTimerIntervalId = null;
}

// テキストセット
export function setStatus(isConnected){
	const el = document.getElementById('status');
	el.innerText = display.statusToText(isConnected);
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

export function setAdminAreaHiddenButtonText(isHidden){
	document.getElementById('btn-adminareahidden').innerText = isHidden ? "表示" : "隠す";
}

export function setSettingsEditorButtonText(isHidden){
	document.getElementById('btn-settingsedithidden').innerText = isHidden ? "設定の変更をする" : "設定の変更を隠す";
}

export function setSettingsEditorVisible(isVisible){
	document.getElementById('settings-senter').style.display = isVisible ? "block" : "none";
	setSettingsEditorButtonText(!isVisible);
}

export function setSettings(settings){
	const el = document.getElementById('settings-list');
	if(!settings){
		el.innerHTML = "設定がありません";
		return;
	}

	const lines = [];
	for(const [key, value] of Object.entries(settings)){
		const label = display.labels[key][0] || key;
		let displayValue = value;
		if(typeof value === "boolean"){
			displayValue = value ? "ON" : "OFF";
		}
		lines.push(`<div>${display.escapeHtml(label)}: ${display.escapeHtml(displayValue)}</div>`);
	}

	el.innerHTML = lines.join("");
}

export function setSettingNameList(settings){
	const el = document.getElementById('setting-name-list');
	if(!settings){
		el.innerHTML = "設定の一覧がありません";
		return;
	}

	const lines = [];
	for(const [key, value] of Object.entries(settings)){
		const label = display.labels[key][0] || key;
		//lines.push(`<div>${display.escapeHtml(label)}: ${display.escapeHtml(key)} = ${display.escapeHtml(typeof value)}</div>`);
		lines.push(`<div>${display.escapeHtml(key)}:= ${display.escapeHtml(typeof value)}, default: ${display.labels[key][1]}</div>`);
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
		if(nowRoles[i] != 0)
			document.getElementById('nowroles').innerText += roleToText(i) + ": " + nowRoles[i] + "人\n";
	}
}

export function setPlayerCount(count){
	document.getElementById('player-count').innerText = count;
}

export function viewAllPlayers(isViewAllPlayersRole, players){
	display.viewAllPlayers(isViewAllPlayersRole, players);
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

export function setDate(count){
	document.getElementById('day-count').innerText = dateToText(count);
}

export function setisDaytime(isDay){
	document.getElementById('isDaytime-display').innerText = isDaytimeToText(isDay);
}

export function setTimerDisplay(text){
	document.getElementById('timer-display').innerText = text;
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
	document.getElementById('role-display').innerText = roleDisplayToText(role);
}

export function setFortune(text){
	document.getElementById('fortune-display').innerText = text;
}

export function setSelectedPlayer(name){
	document.getElementById('selected-player').innerText = name;
}

export function setAction(text){
	document.getElementById('action-display').innerText = text;
}

//　役職設定の表示
export function createRoleCounters(containerId){

	const container = document.getElementById(containerId);
	container.innerHTML = ""; // 初期化
	container.classList.add("role-counter-list");

	roles.forEach(role => {
		const div = document.createElement("div");
		div.className = "role-counter-row";

		if(role.type == "display"){
			div.innerHTML = `
				<span class="role-name">${role.name}</span>
				<span class="role-value-display"><span id="${role.id}">0</span></span>
			`;
		}else{
			div.innerHTML = `
				<label class="role-name" for="${role.id}">${role.name}</label>
				<input type="number" class="value" id="${role.id}" value="0" min="0">
			`;
		}

		container.appendChild(div);
	});
}

// 投票先表示（描画のみ）
export function viewVoteList(voteOptions, onSelectFunction){
	const container = document.getElementById('vote-list');
	container.innerHTML = "";

	if(!Array.isArray(voteOptions) || voteOptions.length === 0){
		container.innerText = "投票できる相手がいません";
		return;
	}

	voteOptions.forEach((name) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'vote-choice-button';
		button.dataset.name = name;
		button.innerText = `${name}を選ぶ`;
		button.addEventListener('click', async () => {
			await onSelectFunction(name);
		});
		container.appendChild(button);
	});
}

// テキスト入力受付
export function getUserName(){
	return document.getElementById('userName').value;
}

export function getDeleteName(){
	return document.getElementById('deleteName').value;
}

export function getSettingName(){
	return document.getElementById('setting-name').value;
}

export function getSettingValue(){
	return document.getElementById('setting-value').value;
}

export function clearSettingInputs(){
	document.getElementById('setting-name').value = "";
	document.getElementById('setting-value').value = "";
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

export function onAdminAreaHiddenClick(callback){
	document.getElementById('btn-adminareahidden').addEventListener('click', callback);
}

export function onSettingsEditHiddenClick(callback){
	document.getElementById('btn-settingsedithidden').addEventListener('click', callback);
}

export function onSettingsEnterClick(callback){
	document.getElementById('btn-settingsenter').addEventListener('click', callback);
}

export function onSettingsResetClick(callback){
	document.getElementById('btn-settingsreset').addEventListener('click', callback);
}

export function onGameNextClick(callback){
	document.getElementById('btn-next').addEventListener('click', callback);
}

export function onTimerResetClick(callback){
	document.getElementById('btn-timer-reset').addEventListener('click', callback);
}

export function onResetbtnClick(callback){
	document.getElementById('btn-reset').addEventListener('click', callback);
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

export function onAllGetClick(callback){
    document.getElementById('btn-allget').addEventListener('click', callback);
}

export function onAllDeleteClick(callback){
	document.getElementById('btn-alldelete').addEventListener('click', callback);
	//localStorage.removeItem('wolf_my_name');
}

export function onTestToolsToggleClick(callback){
	document.getElementById('btn-testtools-toggle').addEventListener('click', callback);
}