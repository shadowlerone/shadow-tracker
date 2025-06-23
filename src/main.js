
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
	}

	// Open the DevTools.
	mainWindow.webContents.openDevTools();
};



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	ipcMain.handle('ping', () => 'pong')
	ipcMain.on('READ_FILE', (event, payload) => {
		const content = fs.readFileSync(payload.path);
		event.reply('READ_FILE', { content });
	});
	ipcMain.on('CHOOSE', (event, payload) => {
		// const content = fs.readFileSync(payload.path);
		const response = current_path.choose(payload)
		console.log(response)
		console.log(current_path.toString())
		event.reply('CHOOSE', response);
	});

	ipcMain.on('SAVE', (event, payload) => {
		save_completed();
		event.reply('SAVE', 'saved!')
	})

	// ipcMain.on('')
	createWindow();

	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.




// LOGIC Stuff
//#region LOGIC STUFF
import ShadowPath from './shadowpath.js'
let current_path = new ShadowPath();

//#endregion

// DASHBOARD STUFF


//#region Twitch Auth

import { User, AUTH_URL, TWITCH_CLIENT_ID, Poll, Twitch } from './twitch.js'
let STATE;
let TOKEN
const twitch_app = new Twitch(TWITCH_CLIENT_ID);

function authenticate(state, url) {
	STATE = state;
	shell.openExternal(url)
}
twitch_app.authenticate(authenticate);



//#endregion
// let USER;



// START POLL

const express = require('express')




// WEBSERVER STUFF
//#region WEBSERVER STUFF
const express_app = express()
const port = 3000

express_app.use(express.json())



express_app.get('/auth', (req, res) => {
	res.sendFile('auth_success.html', {
		root: path.join(__dirname,'public')
	})
})
express_app.post('/set_token', (req, res) => {
	console.log(req.body)
	if (STATE != req.body.state) {
		console.error("STATES DON'T MATCH")
		console.error(`${req.body.state} != ${STATE}`)
	}
	TOKEN = req.body.token;
	twitch_app.setToken(TOKEN)
})
express_app.get('/', (req, res) => {
	res.send(
		current_path.status
	)
})
express_app.get('/public/:file', (req, res) => {
	res.sendFile(req.params.file, {
		root: path.join(__dirname,'public')
	})
})
express_app.get('/status', (req, res) => {
	res.sendFile('status.html', {
		root: path.join(__dirname,'public')
	})
})
express_app.get('/poll', (req, res) => {
	console.log("Creating test poll!")
	let poll = twitch_app.createPoll('test poll', current_path.show_choices_text(),15);
	res.send(poll.data)
	/* poll.start().then((e) => res.send(poll.data)); */
	;
})
express_app.get('/user', (req, res) => {
	res.send(twitch_app.User.data)
})
/* express_app.get('/table', (req, res) => {
	res.send(table[0])
}) */
express_app.get('/unvisited', (req, res) => {
	res.send(
		current_path.unvisited_paths()
	)
})

express_app.get("/current_paths", (req, res) => {
	res.send(current_path.find_current_matching_paths())
})
express_app.get('/visited', (req, res) => {
	res.send(
		current_path.find_visited_paths()

	)
})
/* express_app.get('/table', (req, res) => {
	res.send(
		current_path.table
	)
}) */

express_app.get('/current_options', (req, res) => {
	res.send(current_path.show_choices())
})
express_app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
//#endregion