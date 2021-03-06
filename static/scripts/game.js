const { ipcRenderer } = require('electron');

var app;
var playerCap = 3;
/* ### REMOVE ### */
//var autoLoadData = true;
//var autoLoadData = false;

/* ### REMOVE ### */
//var demoPlayers = ['1', '2', '3'];
/* ### REMOVE ### */
//var demoPlayers = [];
//var demoPlayers = undefined;

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
				data: {"priceStart":"200","priceInc":"200","boards":{"jeopardy":{"categories":[{"name":"Category 1","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 2","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 3","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 4","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 5","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]}]},"doublejeopdary":{"categories":[{"name":"Category 1","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 2","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 3","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 4","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]},{"name":"Category 5","questions":["Question 1","Question 2","Question 3","Question 4","Question 5"]}]},"finaljeopdary":{"question":"Final Jeopardy Question"}}},
				gamestate: 'login',
				playerupname: '',
				currentQuestion: {
					data: 'PLACEHOLDER',
					score: 0,
					disabled: [],
					final: false
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
						score: 0,
						wager: 0
					});
					app.$refs.playerEntry.value = '';
				}
			},
			'gameProgress': (mode) => {
				//Move from login to start (if players are entered in)
				if(mode === 'start' && app.$data.players.length > 1) {
					app.$set(app.$data, 'playerupname', app.$data.players[Math.floor(Math.random() * app.$data.players.length)].name);
					app.$set(app.$data, 'gamestate', 'jeopardy');
					/* ### REMOVE ### */
					//app.$set(app.$data, 'gamestate', 'double');
					fadeOut(document.getElementById('audio--theme'), 1);
					setTimeout(() => {
						document.getElementById('audio--board').play();

						/* ### REMOVE ### */
						/*
						setTimeout(() => {
							//app.finishJeopardy();
						}, 2000);
						*/
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
					//Transition to end and cue music
					} else if(app.$data.gamestate === 'final') {
						app.$set(app.$data, 'gamestate', 'transitionEnd');
						document.getElementById('audio--think').pause();
						document.getElementById('audio--theme').play();
					}
				}
			},
			'openQuestion': (category, index, score, final) => {
				let question = (category === false) ? app.$data.data.boards.finaljeopardy.question : category.questions[index];

				//Transition not happening, go ahead (not Final Jeopardy)
				if(app.$data.clickPermit && !final) {
					//Don't allow double clicking questions
					app.$set(app.$data, 'clickPermit', false);

					//Put data into current question
					app.$set(app.$data.currentQuestion, 'data', question);
					app.$set(app.$data.currentQuestion, 'score', score);
					app.$set(app.$data.currentQuestion, 'disabled', []);
					app.$set(app.$data.currentQuestion, 'final', final);
	
					//Unhide pane
					document.getElementById('questionDisplay').classList.remove('hidden');
					
					//Erase question data
					setTimeout(() => {
						app.$set(category.questions, index, undefined);
					}, 2000);
				//Open Final Jeopardy question
				} else if(app.$data.clickPermit && final) {
					//Don't allow double clicking
					app.$set(app.$data, 'clickPermit', false);

					//Put data into current question
					app.$set(app.$data.currentQuestion, 'data', question);
					app.$set(app.$data.currentQuestion, 'score', 0);
					app.$set(app.$data.currentQuestion, 'disabled', []);
					app.$set(app.$data.currentQuestion, 'final', final);
	
					//Unhide pane
					document.getElementById('questionDisplay').classList.remove('hidden');

					//Play Think!
					setTimeout(() => {
						if(final)
							document.getElementById('audio--think').play();
					}, 2000 + 1000); //Give 1 second after animation completes
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
				let disabled = app.$data.currentQuestion.disabled;

				//Process an answer for not Final Jeopardy
				if(!app.$data.currentQuestion.final) {
					//Good answer
					if(state === true) {
						//Disable all players
						for(let playerIter of app.$data.players) {
							if(disabled.indexOf(playerIter) === -1)
								app.$set(disabled, disabled.length, playerIter);
						}

						//Set current player to next turn leader
						app.$set(app.$data, 'playerupname', player.name);

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
				//Process answer for Final Jeopardy
				} else {
					//Disable current player
					app.$set(disabled, disabled.length, player);

					//Add/remove score based on answer
					app.$set(app.$data.currentQuestion, 'score', player.wager);
					if(state === true)
						app.addScore(player);
					else
						app.removeScore(player);
					
					//Move on to ending if all players have answered
					if(disabled.length === app.$data.players.length) {
						setTimeout(() => {
							app.gameProgress('transition');
						}, 2000);
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
				let board = (app.$data.gamestate == "jeopardy") ? app.$data.data.boards.jeopardy : app.$data.data.boards.doublejeopardy;
				for(let category of board.categories) {
					console.log(`Clensing category ${category.name}...`);
					console.groupCollapsed(category.name);
					for(let questionIndex in category.questions) {
						console.log(questionIndex);
						app.$set(category.questions, questionIndex, undefined);
					}
					console.groupEnd();
				}
				console.groupEnd();
				app.$set(board.categories[0].questions, 0, "Foo?");
				app.openQuestion(board.categories[0], 0, 0);
				setTimeout(() => {
					//app.answerQuestion(app.$data.players[0], true);
					app.closeQuestion();
				}, 2000);
			}
		}
	});

	//Load file data
	ipcRenderer.invoke('file', {
		action: 'load'
	}).then((data) => {
		if(data !== undefined)
			app.$set(app.$data, 'data', data);
		document.getElementById('audio--theme').volume = 0.25;
		document.getElementById('audio--theme').play();
	});
	/* ### REMOVE ### */
	/*
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
	*/

	/* ### REMOVE ### */
	//Load demo players
	/*
	for(let player of demoPlayers) {
		app.$refs.playerEntry.value = player;
		app.addPlayer();
	}
	*/
	/* ### REMOVE ### */
	/*
	if(demoPlayers)
		app.gameProgress('start')
	*/
});

//Listen for key presses
window.addEventListener('keyup', (e) => {
	//Reload on F5
	if(e.key === 'F5')
		window.location.reload()
});