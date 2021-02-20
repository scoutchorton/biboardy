const { ipcRenderer } = require('electron');

var app;
var playerCap = 3;
/* ### REMOVE ### */
var autoLoadData = false;
var autoPlayTheme = true;

/* ### REMOVE ### */
//var demoPlayers = ['1', '2', '3'];
/* ### REMOVE ### */
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
				playerupname: '',
				currentQuestion: {
					data: 'PLACEHOLDER',
					score: 0,
					disabled: []
				},
				clickPermit: true
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

						/* ### REMOVE ### */
						setTimeout(() => {
							//app.finishJeopardy();
						}, 2000);
					}, 1000);
				//Show score summary, sort of like an ad break
				} else if(mode === "transition") {
					//Transition to break after Jeopardy
					if(app.$data.gamestate === 'jeopardy') {
						app.$set(app.$data, 'gamestate', 'transitionDouble');
					//Transition to Double Jeopardy
					} else if(app.$data.gamestate === 'transitionDouble') {
						app.$set(app.$data, 'gamestate', 'double');
					//Transition to break after Double Jeopardy
					} else if(app.$data.gamestate === 'double') {
						app.$set(app.$data, 'gamestate', 'transitionFinal');
					//Transition to Final Jeopardy
					} else if(app.$data.gamestate === 'transitionFinal') {
						app.$set(app.$data, 'gamestate', 'final');
					//Transition to end
					} else if(app.$data.gamestate === 'final') {
						app.$set(app.$data, 'gamestate', 'transitionEnd');
					}
				}
			},
			'openQuestion': (category, index, score) => {
				let question = category.questions[index];

				//Transition not happening, go ahead
				if(app.$data.clickPermit) {
					//Don't allow double clicking questions
					app.$set(app.$data, 'clickPermit', false);

					//Put data into current question
					app.$set(app.$data.currentQuestion, 'data', question);
					app.$set(app.$data.currentQuestion, 'score', score);
					app.$set(app.$data.currentQuestion, 'disabled', []);
	
					//Unhide pane
					document.getElementById('questionDisplay').classList.remove('hidden');
					
					//Erase question data
					setTimeout(() => {
						app.$set(category.questions, index, undefined);
					}, 2000);
				}
			},
			'closeQuestion': () => {
				//Hide pane
				document.getElementById('questionDisplay').classList.add('hidden');

				//Reset data and allow question clicking
				setTimeout(() => {
					app.$set(app.$data.currentQuestion, 'data', 'PLACEHOLDER');
					app.$set(app.$data.currentQuestion, 'score', 0);
					app.$set(app.$data, 'clickPermit', true);

					//Check for transitioning between categories
					let gameQuitState = true;
					let categoryData = (app.$data.gamestate === 'jeopardy') ? app.$data.data.boards.jeopardy.categories : app.$data.data.boards.doublejeopardy.categories;
					//Iterate categories
					for(let category of categoryData) {
						//Iterate questions
						for(let questionIndex in category.questions) {
							//Check for question data, and break if data is found
							if(category.questions[questionIndex]) {
								gameQuitState = false;
								break;
							}
						}
						//Break category loop if hope is lost
						if(!gameQuitState)
							break;
					}

					//Transition if no question data was found
					if(gameQuitState)
						app.gameProgress('transition');
				}, 2000);
			},
			'answerQuestion': (player, state) => {
				//Good answer
				if(state === true) {
					let disabled = app.$data.currentQuestion.disabled;

					//Disable all players
					for(let playerIter of app.$data.players) {
						if(disabled.indexOf(playerIter) === -1)
							app.$set(disabled, disabled.length, playerIter);
					}

					//Give score
					app.addScore(player);

					//Wait before closing question
					setTimeout(() => {
						app.closeQuestion();
					}, 1500);
				} else {
					let disabled = app.$data.currentQuestion.disabled;

					//Take score
					app.removeScore(player);

					//Disable current player
					app.$set(disabled, disabled.length, player);

					//Play wrong answer and close if all players answered incorrectly
					if(disabled.length === app.$data.players.length) {
						document.getElementById('audio--time-up').play();
						setTimeout(() => {
							app.closeQuestion();
						}, 1500);
					}
				}
			},
			'addScore': (player) => {
				player.score += app.$data.currentQuestion.score;
			},
			'removeScore': (player) => {
				player.score -= app.$data.currentQuestion.score;
			},
			/* ### REMOVE ### */
			'finishJeopardy': () => {
				console.group('clense');
				for(let category of app.$data.data.boards.jeopardy.categories) {
					console.log(`Clensing category ${category.name}...`);
					console.groupCollapsed(category.name);
					for(let questionIndex in category.questions) {
						console.log(questionIndex);
						app.$set(category.questions, questionIndex, undefined);
					}
					console.groupEnd();
				}
				console.groupEnd();
				app.$set(app.$data.data.boards.jeopardy.categories[0].questions, 0, "Foo?");
				app.openQuestion(app.$data.data.boards.jeopardy.categories[0], 0, 0);
				setTimeout(() => {
					app.answerQuestion(app.$data.players[0], true);
				}, 2000);
			}
		}
	});

	/* ### REMOVE ### */
	//Load file data
	if(!autoLoadData) {
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
		let data = require('../../games/childrens_church_review.json');
		app.$set(app.$data, 'data', data);
	}

	/* ### REMOVE ### */
	//Load demo players
	for(let player of demoPlayers) {
		app.$refs.playerEntry.value = player;
		app.addPlayer();
	}
	/* ### REMOVE ### */
	if(demoPlayers)
		app.gameProgress('start')
});

//Listen for key presses
window.addEventListener('keyup', (e) => {
	//Reload on F5
	if(e.key === 'F5')
		window.location.reload()
});