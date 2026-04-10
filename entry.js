import * as firebase from "./firebase.js";
import { statusToText } from "./display.js";
import { setVersionText } from "./version.js";
setVersionText();

// テスト用
window.test = {
    firebase: firebase,
    movin: firebase.moveRoom,
    newin: firebase.newRoom,
    delin: firebase.deleteRoom
};

const statusEl = document.getElementById("status");
const userNameEl = document.getElementById("userName");
const joinBtnEl = document.getElementById("btn-join");
const roomKeyEl = document.getElementById("roomKey");
const ENTRY_BACK_FLAG_KEY = "wolf_back_to_entry";

let isConnected = false;

let pageBacked = sessionStorage.getItem(ENTRY_BACK_FLAG_KEY) === "1";
if (pageBacked) {
    sessionStorage.removeItem(ENTRY_BACK_FLAG_KEY);
}

function isGameStarted(game) {
    return game && game.date != null && game.date >= 0;
}

function isValidPlayerName(name) {
  return name.length > 0 && !/[.#$/[\]]/.test(name);
}

function goGamePage() {
    window.location.href = "./index.html";
}

function applyPrefillFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const prefillName = (params.get("name") || params.get("user") || "").trim();
    const prefillRoom = (params.get("room") || params.get("key") || "").trim();

    if (!!prefillName) {
        userNameEl.value = prefillName;
        localStorage.setItem("wolf_my_name", prefillName);
    }
    if (!!prefillRoom) {
        roomKeyEl.value = prefillRoom;
        firebase.setKey(prefillRoom);
    }

    return !!(prefillName || prefillRoom);
}

async function tryAutoEnterFromLocalStorage() {
    const savedName = (localStorage.getItem("wolf_my_name") || "").trim();
    const savedKey = firebase.localGetKey();

    userNameEl.value = savedName;
    roomKeyEl.value = firebase.removeSlash(savedKey);

    if (!savedName || !savedKey) return;

    firebase.setKey(savedKey);
    const exists = await firebase.getIsPlayerExist(savedName);
    if (exists && !pageBacked) {
        goGamePage();
    }
}

firebase.watchConnection((connected) => {
    isConnected = !!connected;
    statusEl.innerText = statusToText(isConnected);
});

joinBtnEl.addEventListener("click", async () => {
    if (!isConnected) {
        alert("接続されていません");
        return;
    }

    const name = (userNameEl.value || "").trim();
    if (!name) {
        alert("名前を入力してね");
        return;
    }

    const roomKey = (roomKeyEl.value || "").trim();
    if (!roomKey) {
        alert("部屋番号を入力してね");
        return;
    }
    const existsKey = await firebase.isExistKey(roomKey);
    if (!existsKey) {
        alert("指定された部屋は存在しません");
        return;
    }

    firebase.setKey(roomKey);

    const exists = await firebase.getIsPlayerExist(name);
    localStorage.setItem("wolf_my_name", name);

    if (exists) {
        alert(name + "さんとして再参加しました");
        goGamePage();
        return;
    }

    const gameData = await firebase.getGame();
    if (isGameStarted(gameData)) {
        alert("ゲーム中には参加できません");
        return;
    }

    if (!isValidPlayerName(name)) {
        alert("名前に使用できない文字が含まれています");
        return;
    }

    await firebase.addPlayer(name);
    alert(name + "さん、参加完了！");
    goGamePage();
});

applyPrefillFromUrl();
await tryAutoEnterFromLocalStorage();
