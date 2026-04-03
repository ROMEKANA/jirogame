import * as firebase from "./firebase.js";
import { roles } from "./ui.js";

// シャッフル関数
function shuffle(array){
	for(let i = array.length - 1; i > 0; i--){
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

// 役職のシャッフルと配布
export function assignRoles(){
	firebase.getAllPlayers((players)=>{
		if(!players) {
			alert("参加者がいません");
			return;
		}

		const rolecounts ={};
		for(const role of roles){
			rolecounts[role.number] = (role.type == "input") ? Number(document.getElementById(role.id).value) : Number(document.getElementById(role.id).innerText);
			if(isNaN(rolecounts[role.number]) || rolecounts[role.number] < 0){
				alert("役職の数を正しく入力してください");
				return;
			}
		}

		const names = Object.keys(players);

		const rolecountsArray = [];

		for(const role in rolecounts){
			for(let i = 0; i < rolecounts[role]; i++){
				rolecountsArray.push(role);
			}
		}

		shuffle(rolecountsArray);

		names.forEach((name, i)=>{
			firebase.updateRole(name, rolecountsArray[i % rolecountsArray.length]);
		});
	});
}

//　どちらが勝ったのかの判定
export function checkWinner(callback){
	firebase.getCountAlivePlayers((aliveCount)=>{
		firebase.getRoleCount(1, (wolfCount)=>{
			if(wolfCount == 0){
				firebase.updateWinner(1);
				callback(1);
			}else if(wolfCount >= aliveCount - wolfCount){
				firebase.updateWinner(2);
				callback(2);
			}else{
				//firebase.updateWinner(0);
				callback(0);
			}
		});
	});
}

// ゲームが開始したかどうかの判定
export function isGameStarted(){
	firebase.getDate((date)=>{
		return (date !== null && date !== undefined);
	});
}

// 次のフェーズへの移行処理
export function goNextPhase(){
	firebase.getGame((game)=>{
		if(!game.time){ //夜から昼へ
			if(game.date == 1) // 一日目の襲撃はなし
				
		}
	});
}