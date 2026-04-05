//　変数の定義
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

export function furtuneToText(fortune){
	if(fortune === null) return "占い結果がここに表示されます";
	return fortune == 1 ? "人狼です" : "人狼ではありません";
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
	if(typeof date === "object" && date !== null && "date" in date){
		return `${date.date}日目`;
	}
	return `${date}日目`;
}

export function timeToText(date){
	if(date === null) return "開始前";
	if(typeof date === "object" && date !== null && "time" in date){
		return date.time ? "昼" : "夜";
	}
	return date ? "昼" : "夜";
}

export function teamToText(team){
	switch(Number(team)){
		case null: return "開始前";
		case 0: return "試合中";
		case 1: return "市民陣営";
		case 2: return "人狼陣営";
		default: return "未定義";
	}
}

export function roleActionToText(role){
	switch(Number(role)){
		case 1: return "誰を襲撃しますか？";
		case 2: return "誰を占いますか？";
		default: return "怪しいと思う人を選んでください";
	}
}

export function roleActionButtonText(role){
	switch(Number(role)){
		case 1: return "襲撃";
		case 2: return "占い";
		default: return "怪しむ";
	}
}

