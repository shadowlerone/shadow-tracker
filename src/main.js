
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const fs = require('fs');
const config = require(path.join(__dirname, 'data', 'config.json'))
const DEFAULT_POLL_DURATION = config.default_poll_duration ? config.default_poll_duration : 120

// app.setPath("userData", path.join(__dirname, 'data'))
console.log(app.getPath("userData"))
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}
// let mainWindow;
const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});
	twitch_app.on_setup = (t) => {
		console.log("Called on_setup")
		t.on('channel.poll.end', (event) => {
			console.log("DETECTED A POLL ENDING")
			if (t.last_poll.result_received && t.last_poll.id == event.id){
				console.log("DOUBLE POLL RESULT DETECTED")
				return;
			}
			if (event.status == 'archived'){
				return;
			}
			if (t.last_poll.id != event.id || (t.last_poll.id == event.id && !t.last_poll.result_received)) {
				console.log(event)
				console.log(event.choices)
				let base_choice = { votes: -1 }
				var winner = event.choices.reduce((a, c) => {
					if (Array.isArray(a)) {
						console.log("Sorting hit array")
						var ac = a[0]
						if (ac.votes == c.votes) {
							console.log("Sorting pushed to array")
							a.push(c)
							return a
						}
						return ac.votes < c.votes ? c : ac
					} else {
						if (c.votes == a.votes) {
							console.log("Sorting created to array")
							return [a, c]
						}
						return a.votes < c.votes ? c : a
					}
				}, base_choice)
				console.log(`Winner: ${winner}`)
				t.last_poll.result_received = true;
				mainWindow.webContents.send('POLL:END', winner)
			}

		})
	}
	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
	}

	// Open the DevTools.
	if (config.debug && config.debug == true) {
		mainWindow.webContents.openDevTools();
	}

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
		// event.reply('STATUS', current_path.statistics)

	});

	ipcMain.on('SAVE', (event, payload) => {
		var i = current_path.save_completed();
		event.reply('SAVE', i)
		event.reply('STATUS', current_path.statistics)

	})
	ipcMain.on('STATUS', (event, payload) => {
		event.reply('STATUS', current_path.statistics)
	})
	ipcMain.on('RESET', (event, payload) => {
		current_path.reset();
		event.reply('STATUS', current_path.statistics)
	})
	ipcMain.on('POLL:START', (event, payload) => {
		let poll = twitch_app.createPoll(payload.title ? payload.title : `Route for level ${current_path.length + 1}`, current_path.show_choices_text(), payload.duration ? payload.duration : 15);
		// poll.start()
		// res.send(poll.data)
		event.reply('POLL:STARTED', current_path.statistics)
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
		try {
			current_path.save_completed();
		} catch {

		} finally {
			app.quit();
		}
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.




// LOGIC Stuff
//#region LOGIC STUFF
import ShadowPath from './shadowpath.js'
let table_fp = path.resolve(__dirname, 'data', 'table.json');
let completed_fp = path.join(app.getPath("userData"), 'completed.json');

if (!fs.existsSync(completed_fp)) {
	fs.writeFileSync(completed_fp,
		fs.readFileSync(path.resolve(__dirname, 'data', 'completed.json'))
		, 'utf-8')
}
let current_path = new ShadowPath(table_fp, completed_fp);

//#endregion

// DASHBOARD STUFF


//#region Twitch Auth

import { User, AUTH_URL, TWITCH_CLIENT_ID, Poll, Twitch } from './twitch.js'
let STATE;
let TOKEN
const twitch_app = new Twitch(TWITCH_CLIENT_ID);
let POLL;
function authenticate(state, url) {
	STATE = state;
	shell.openExternal(url)
}


twitch_app.authenticate(authenticate);
console.log("Called authenticate")


//#endregion

const express = require('express')




// WEBSERVER STUFF
//#region WEBSERVER STUFF
const express_app = express()
const port = config.port ? config.port : 3000

express_app.use(express.json())



express_app.get('/auth', (req, res) => {
	res.sendFile('auth_success.html', {
		root: path.join(__dirname, 'public')
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
		root: path.join(__dirname, 'public')
	})
})
express_app.get('/status', (req, res) => {
	res.sendFile('status.html', {
		root: path.join(__dirname, 'public')
	})
})
express_app.get('/poll', async (req, res) => {
	console.log("Creating test poll!")
	let poll = await twitch_app.createPoll('test poll', current_path.show_choices_text(), DEFAULT_POLL_DURATION);
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