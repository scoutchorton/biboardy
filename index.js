/**
 * Imports
 */
const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron");
const fs = require('fs');

/**
 * Electron loading
 */
let win;
//Create Electron window
function createMain() {
	//Create window
	win = new BrowserWindow({
		width: 1280,
		height: 720,
		center: true,
		webPreferences: {
			nodeIntegration: true
		}
	});

	//Open files to process
	if(process.argv.indexOf('edit') >= 0) {
		win.loadFile('static/editor/index.html');
		console.log("editor");
	} else {
		win.loadFile('static/game/index.html');
		console.log("game");
	}

	//Start with DevTools if using a debug flag
	if(process.argv.indexOf('--debug') >= 0 || process.argv.indexOf('-d') >= 0)
		win.webContents.openDevTools();

	Menu.setApplicationMenu(null);
}

/*
//Create prompt
async function prompt(name, message) {
	let promptWin = new BrowserWindow({
		parent: win,
		modal: true,

	});
	//promptWin.loadFile(`static/dialog/prompt.html?name=${encodeURI(name)}&message=${encodeURI(message)}`);
	promptWin.loadFile(`static/dialog/prompt.html`);
	promptWin.webContents.openDevTools();
}
*/

//Start window
app.whenReady().then(createMain).catch(err => {
	app.quit();
	throw err;
});

//Mac stuff
app.on('window-all-closed', () => {
	if(process.platform !== 'darwin')
		app.quit();
});
app.on('activate', () => {
	if(BrowserWindow.getAllWindows.length === 0)
		createMain();
});

//Process messages from render process
ipcMain.on('file', (e, data) => {
	//Data represending the file
	let fileData;

	console.log(data);

	//Open file save dialog
	if(data.action === 'save') {
		let fileDataPath = dialog.showSaveDialogSync(win, {
			title: 'Save game data',
			filters: [
				{name: 'Game Data', extensions: ['json']}
			]
		});
		fs.writeFileSync(fileDataPath, JSON.stringify(data.data));
	//Open file open dialog
	} else if(data.action === 'load') {
		let fileDataPath = dialog.showOpenDialogSync(win, {
			title: 'Open game data',
			filters: [
				{name: 'Game Data', extensions: ['json']}
			]
		});
		fileData = fs.readFileSync(fileDataPath);
		ipcMain.sendSync('file', {
			action: 'load',
			data: JSON.parse(fileData)
		});
	//Show message when action is not known
	} else
		console.warn(`File action ${data.action} unknown. No action taken.`);
});

/*
ipcMain.handle('prompt', async (e, data) => {
	return await prompt(data.name, data.message);
});
*/