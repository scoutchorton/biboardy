/**
 * Imports
 */
const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron");
const fs = require('fs').promises;
//const path = require('path');

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
		},
		icon: 'static/assets/logo_1024x1024.png'
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
ipcMain.handle('file', async (e, data) => {
	//Open file save dialog
	if(data.action === 'save') {
		let fileDataPath = await dialog.showSaveDialog(win, {
			title: 'Save game data',
			filters: [
				{name: 'Game Data', extensions: ['json']}
			]
		});
		if(fileDataPath.filePath !== undefined)
			return await fs.writeFile(fileDataPath.filePath, JSON.stringify(data.data));
		else
			return undefined
	//Open file open dialog
	} else if(data.action === 'load') {
		let fileDataPath = await dialog.showOpenDialog(win, {
			title: 'Open game data',
			filters: [
				{name: 'Game Data', extensions: ['json']}
			]
		});
		if(fileDataPath.filePaths[0] !== undefined)
			return JSON.parse(await fs.readFile(fileDataPath.filePaths[0]));
		else
			return undefined
	//Show message when action is not known
	} else
		console.warn(`File action ${data.action} unknown. No action taken.`);
	
	return undefined;
});