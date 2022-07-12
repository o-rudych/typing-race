import { addClass, removeClass } from "./helpers/domHelper.mjs";
import { get } from "./helpers/requestHelper.js";
import { showMessageModal, showResultsModal } from "./views/modal.mjs";
import { appendRoomElement, updateNumberOfUsersInRoom, removeAllRoomElements } from "./views/room.mjs";
import { appendUserElement, changeReadyStatus, removeAllUserElements, removeUserElement, setProgress } from "./views/user.mjs";

const username = sessionStorage.getItem('username');

if (!username) {
	window.location.replace('/login');
}

const addRoomButton = document.querySelector('#add-room-btn');
const readyButton = document.querySelector('#ready-btn');
const quitRoomButton = document.querySelector('#quit-room-btn');
const roomsPage = document.querySelector('#rooms-page');
const gamePage = document.querySelector('#game-page');
const gameTimer = document.querySelector('#game-timer');
const gameTimerSeconds = document.querySelector('#game-timer-seconds');
const timer = document.querySelector('#timer');
const textContainer = document.querySelector('#text-container');
const helloUser = document.querySelector('#hello-user');
const helloTitle = document.querySelector('#hello-title');

removeClass(helloUser, "display-none");
helloTitle.innerHTML = `Hello, ${username}!`;

const textsEndpoint = "game/texts";

let textToType = "";
let currentIndex = 0;
let currentChar = "";

const getText = async (id) => {
	return await get(textsEndpoint, id);
}

const socket = io('/', { query: { username } });

const onAddRoom = () => {
	const name = prompt('Input Room Name');
	if (!name) return;
	socket.emit("ADD_ROOM", name);
};
addRoomButton.addEventListener('click', onAddRoom);

const onKeyUp = ev => {
	if (ev.key === currentChar) {
		socket.emit("SUCCESSFUL_SYMBOL", currentIndex);
		currentIndex++;
		currentChar = textToType[currentIndex];
		highlight();
	}
};

const updateRooms = rooms => {
	removeAllRoomElements();
	rooms.forEach(room => {

		const { name, numberOfUsers, availableToJoin } = room;
		const onJoin = () => {
			socket.emit("JOIN_ROOM", name);
		};
		if (availableToJoin) {
			appendRoomElement({ name, numberOfUsers, onJoin })
		}

	});
};

const updateRoom = room => {
	const roomNameElement = document.querySelector('#room-name');

	const onQuitRoom = () => {
		addClass(gamePage, "display-none");
		removeClass(roomsPage, "display-none");

		quitRoomButton.removeEventListener('click', onQuitRoom)
		readyButton.removeEventListener('click', onReadyButton);

		socket.emit("QUIT_ROOM", room.name);
	}
	const onReadyButton = () => {
		socket.emit("CHANGE_READY", room.name);
	}

	quitRoomButton.addEventListener('click', onQuitRoom)
	readyButton.addEventListener('click', onReadyButton);

	roomNameElement.innerHTML = room.name;

	removeAllUserElements();
	room.users.forEach(user => {
		appendUserElement({
			username: user.username,
			ready: user.isReady,
			isCurrentUser: (username === user.username)
		})
	});

	if (readyButton.classList.contains("display-none")) {
		removeClass(readyButton, "display-none");
		addClass(timer, "display-none");
		addClass(textContainer, "display-none");
		addClass(gameTimer, "display-none");
	}
	readyButton.innerHTML = "READY";
}

const joinRoomDone = room => {

	addClass(roomsPage, "display-none");
	removeClass(gamePage, "display-none");
	updateRoom(room);
};

const newUserJoined = user => {
	appendUserElement({
		username: user.username,
		ready: user.isReady,
		isCurrentUser: false
	});
}

const userLeft = user => {
	removeUserElement(user.username);
}

const numberOfUsersInRoomChanged = (room) => {
	updateNumberOfUsersInRoom({
		name: room.name,
		numberOfUsers: room.numberOfUsers
	})
}

const maximumOfUsersInRoomReached = (room) => {
	const message = `Maximum of users in room ${room.name} reached`;
	showMessageModal({
		message: message
	})
}

const changeReady = user => {
	changeReadyStatus({
		username: user.username,
		ready: user.isReady
	});
	if (username === user.username) {
		readyButton.innerHTML = Boolean(user.isReady) ? "NOT READY" : "READY";
	}

}

const startTimer = async ({ seconds, textId }) => {
	addClass(readyButton, "display-none");
	addClass(quitRoomButton, "display-none");
	removeClass(timer, "display-none")
	timer.innerHTML = seconds;
	textToType = await getText(textId);
}

const changeTimer = seconds => {
	timer.innerHTML = seconds;
}

const changeGameTimer = seconds => {
	gameTimerSeconds.innerHTML = seconds;
}

const highlight = () => {
	const currentElement = document.querySelector(`span[data-index='${currentIndex}']`);
	if (currentElement) {
		addClass(currentElement, "underlined");
	}
	if (currentIndex > 0) {
		const prevElement = document.querySelector(`span[data-index='${currentIndex - 1}']`);
		if (prevElement) {
			addClass(prevElement, "successful");
			removeClass(prevElement, "underlined");
		}
	}
}

const startGame = name => {
	addClass(timer, "display-none");
	removeClass(textContainer, "display-none");
	removeClass(gameTimer, "display-none");
	window.addEventListener('keyup', onKeyUp);

	currentIndex = 0;
	currentChar = textToType[currentIndex];

	textContainer.innerHTML = Array.from(textToType)
		.map((char, index) => `<span data-index=${index}>${char}</span>`)
		.join("");
	highlight();
}

const userExistHandler = (username) => {

	sessionStorage.removeItem('username');
	addClass(roomsPage, "display-none");

	const message = `User "${username}" already exists!`;
	showMessageModal({
		message: message,
		onClose: () => {
			window.location.replace('/login');
		}
	})
}

const roomExistHandler = (name) => {
	const message = `Room "${name}" already exists!`;
	showMessageModal({
		message: message
	})
}

const roomDoesNotExistHandler = (name) => {
	const message = `Room "${name}" doesn't exist!`;
	showMessageModal({
		message: message
	})
}

const finishGame = ({ name, winners }) => {
	addClass(gameTimer, "display-none");
	window.removeEventListener('keyup', onKeyUp);
	showResultsModal({
		usersSortedArray: winners,
		onClose: () => {
			addClass(textContainer, "display-none");
			removeClass(quitRoomButton, "display-none");
			removeClass(readyButton, "display-none");
			socket.emit("SET_NOT_READY", name);
		}
	})
}

socket.on("USER_EXIST", userExistHandler);
socket.on("ROOM_EXIST", roomExistHandler);
socket.on("UPDATE_ROOMS", updateRooms);
socket.on("ADD_ROOM_DONE", joinRoomDone);
socket.on("JOIN_ROOM_DONE", joinRoomDone);
socket.on("ROOM_DOES_NOT_EXIST", roomDoesNotExistHandler);
socket.on("NEW_USER_JOINED", newUserJoined);
socket.on("USER_LEFT", userLeft);
socket.on("NUMBER_OF_USERS_IN_ROOM_CHANGED", numberOfUsersInRoomChanged);
socket.on("MAXIMUM_USERS_FOR_ONE_ROOM", maximumOfUsersInRoomReached);
socket.on("READY_CHANGED", changeReady);

socket.on("TIMER_STARTED", startTimer);
socket.on("TIMER_CHANGED", changeTimer);
socket.on("TIMER_IS_UP", startGame);
socket.on("GAME_TIMER_CHANGED", changeGameTimer);
socket.on("GAME_OVER", finishGame);
socket.on("PROGRESS_CHANGED", setProgress);
