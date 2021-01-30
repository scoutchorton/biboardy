const { ipcRenderer } = require('electron');

var app;
var autoPlayTheme = true;
var autoLoadData = true;
var playerCap = 3;

//var demoPlayers = ['Adam', 'Eve', 'Jesus'];
var demoPlayers = [];

function fadeOut(element, length) {
	//Only accept audio elements
	if(element.constructor != HTMLAudioElement)
		throw `Expected an HTMLAudioElement, instead got ${element.constructor}`;
	else {
		let initVolume = element.volume;
		let change = element.volume / (length * 250);
		let fadeInterval = setInterval(() => {
			if(element.volume <= change) {
				clearInterval(fadeInterval);
				element.pause();
				element.volume = initVolume;
			} else
				element.volume -= change;
		}, length);
	}
}

window.addEventListener('load', () => {
	//Load Vue instance
	//let app = new Vue({
	app = new Vue({
		el: '#game',
		data: () => {
			return {
				players: [],
				data: {"priceStart":"200","priceInc":"200","boards":{"jeopardy":{"categories":[{"name":"Category 1","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 2","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 3","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 4","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 5","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]}]},"doublejepodary":{"categories":[{"name":"Category 1","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 2","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 3","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 4","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 5","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]}]},"finaljepodary":{"question":"Final Jeopardy Question"}}},
				gamestate: 'login',
				playerupname: ''
			}
		},
		methods: {
			'addPlayer': () => {
				//Allow max players (if playerCap is a positive, non-zero number)
				if(app.$data.players.length < playerCap || playerCap <= 0) {
					//Add player to dataset and clear textbox
					app.$set(app.$data.players, app.$data.players.length, {
						name: app.$refs.playerEntry.value,
						score: 0
					});
					app.$refs.playerEntry.value = '';
				}
			},
			'gameProgress': (mode) => {
				//Move from login to start (if players are entered in)
				if(mode === 'start' && app.$data.players.length > 1) {
					app.$set(app.$data, 'playerupname', app.$data.players[Math.floor(Math.random() * app.$data.players.length)].name);
					app.$set(app.$data, 'gamestate', 'jeopardy');
					fadeOut(document.getElementById('audio--theme'), 1);
					setTimeout(() => {
						document.getElementById('audio--board').play();
					}, 1000);
				}
			}
		}
	});

	//Initalize game music
	/*
	document.getElementById('audio--theme').addEventListener('canplay', (e) => {
		e.target.volume = 0.25;
		if(autoPlayTheme)
			e.target.play();
	});
	*/

	//Load file data
	if(autoLoadData) {
		ipcRenderer.invoke('file', {
			action: 'load'
		}).then((data) => {
			if(data !== undefined)
				app.$set(app.$data, 'data', data);
			document.getElementById('audio--theme').volume = 0.25;
			if(autoPlayTheme)
				document.getElementById('audio--theme').play();
		});
	} else {
		let data = require('../../.games/childrens_church_review.json');
		app.$set(app.$data, 'data', data);
	}

	//Load demo players
	for(let player of demoPlayers) {
		app.$refs.playerEntry.value = player;
		app.addPlayer();
	}
	if(demoPlayers)
		app.gameProgress('start')

	//console.log(JSON.stringify(app.$data.data.boards, null, '\t'));

	//Remove second question from second category
	//app.$set(app.$data.data.boards.jeopardy.categories[1].questions, 1, '');
});

//Listen for key presses
window.addEventListener('keyup', (e) => {
	//Reload on F5
	if(e.key === 'F5')
		window.location.reload()
});