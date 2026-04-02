import * as firebase from "./firebase.js";

export const ROLE = {
	NONE : 0,		// 未参加
	CITIZEN : 1,	// 村人
	WOLF : 2,		// 人狼
	SEER : 3,		// 占い師
	MADMAN : 4		// 狂人
};

export function joinGame(name){
	return firebase.addPlayer(name);
}

function shuffle(array){
	for(let i = array.length - 1; i > 0; i--){
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export function assignRoles(){
	firebase.watchPlayersOnce((players)=>{
		if(!players) {
			alert("参加者がいません");
			return;
		}

		const rolecounts = {
			[ROLE.CITIZEN]: Number(document.getElementById('citizen-count').innerText),
			[ROLE.WOLF]: Number(document.getElementById('wolf-count').value),
			[ROLE.SEER]: Number(document.getElementById('seer-count').value),
			[ROLE.MADMAN]: Number(document.getElementById('madman-count').value)
		};

		for(const role in rolecounts){
			if(rolecounts[role] < 0){
				alert("役職の数は0以上にしてください");
				return;
			}
		}

		const names = Object.keys(players);

		const roles = [];

		for(const role in rolecounts){
			for(let i = 0; i < rolecounts[role]; i++){
				roles.push(Number(role));
			}
		}
		shuffle(roles);

		names.forEach((name, i)=>{
			firebase.updateRole(name, roles[i % roles.length]);
		});

		alert("役職を配りました！");
	});
}

export function watchRole(name, callback){
	firebase.watchRole(name, callback);
}

