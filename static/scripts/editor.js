const { ipcRenderer } = require('electron');

var editor;
var prompt
var temp;

window.addEventListener('load', () => {	
	//Load editor Vue instance
	//let editor = new Vue({
	editor = new Vue({
		el: '#editor',
		data: () => {
			return {
				'jepodary': {
					categories: [
						{
							name: "Category 1",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 2",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 3",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 4",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 5",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}
					]
				},
				'doublejepodary': {
					categories: [
						{
							name: "Category 1",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 2",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 3",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 4",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}, {
							name: "Category 5",
							questions: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
						}
					]
				},
				'finaljepodary': {
					question: 'Final Jepodary Question'
				},
			};
		}
	});
	//let prompt = new Vue({
	prompt = new Vue({
		el: '#prompt',
		data: () => {
			return {
				visible: false,
				message: '',
				value: ''
			}
		},
		methods: {
			submit: () => {
				prompt.visible = false;
				prompt.$emit('close');
			},
			cancel: () => {
				prompt.value = '';
				prompt.visible = false;
				prompt.$emit('close');
			}
		}
	})

	//Change visible board
	document.getElementById('menu--mode').addEventListener('change', (e) => {
		console.log(e.target.getAttribute('value'));
	});

	//Change number board
	for(let num of document.querySelectorAll('.menu .number')) {
		num.addEventListener('change', (e) => {
			console.log('Number change:', e.target.getAttribute('value'));
		});
	}

	//Category editing dialog
	let categories = document.querySelectorAll('.category');
	for(let category of categories) {
		category.addEventListener('click', (e) => {
			//Variables
			//temp = e.target;
			let categoryDiv = e.target.parentElement;
			let categoryIndex = Array.from(categoryDiv.parentElement.children).indexOf(categoryDiv);
			//editor.$data.categories[categoryIndex].name;
			console.log(`Category ${categoryIndex} name`);
			console.log(`Category ${categoryIndex} name`);

			prompt.message = `Category ${categoryIndex + 1} name`;
			prompt.value = e.target.innerText;
			prompt.visible = true;

			prompt.$once('close', () => {
				
			});
		});
	}

	//Question editing dialog
	let questions = document.querySelectorAll('.question');
	for(let question of questions) {
		question.addEventListener('click', (e) => {
			temp = e.target;
			console.log('Question editing...', temp);
		});
	}

	//Send data to main program to save file data
	document.getElementById('menu--save').addEventListener('click', () => {
		ipcRenderer.sendSync('file', {
			action: 'save',
			data: {
				priceStart: document.getElementById('settings--start-price').value,
				priceInc: document.getElementById('settings--start-price').value,
				boards: {
					jepodary: editor.$data.jepodary,
					doublejepodary: editor.$data.doublejepodary,
					finaljepodary: editor.$data.finaljepodary
				}
			}
		})
	});

	//Load data from main process to get file data
	document.getElementById('menu--load').addEventListener('click', () => {
		ipcRenderer.sendSync('file', {
			action: 'load'
		});
		//Process data sent back from main process
		ipcRenderer.once('file', (e, data) => {
			//Only allow load data
			if(data.action !== 'load')
				console.warn(`Expected load action, instead got ${data.action}.`);
			
			//Load price data
			document.getElementById('settings--start-price').querySelector('input[type=number]').value = data.priceStart;
			document.getElementById('settings--start-inc').querySelector('input[type=number]').value = data.priceInc;

			//Load board data
			editor.$data.jepodary = data.boards.jepodary;
			editor.$data.doublejepodary = data.boards.doublejepodary;
			editor.$data.finaljepodary = data.boards.finaljepodary;
		});
	});
});

//Listen for key presses
window.addEventListener('keyup', (e) => {
	//Reload on F5
	if(e.key === 'F5')
		window.location.reload()
});