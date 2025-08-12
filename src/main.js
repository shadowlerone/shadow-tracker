
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const fs = require('fs');
const config = require(path.join(__dirname, 'data', 'config.json'))
import setupLogger from './logger.js'
const DEFAULT_POLL_DURATION = config.default_poll_duration ? config.default_poll_duration : 120

// const logger = setupLogger()

// app.setPath("userData", path.join(__dirname, 'data'))
const USER_DATA_FOLDER = app.getPath("userData");

const logger = setupLogger(USER_DATA_FOLDER)

function userDataFolder(folder){
	return path.join(USER_DATA_FOLDER, folder)
}
logger.debug("App Path", USER_DATA_FOLDER)
// console.log(USER_DATA_FOLDER)

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
		// logger.debug("Called on_setup") 
		logger.verbose("Setting up twitch callbacks");
		t.on('channel.poll.end', (event) => {
			// console.log("DETECTED A POLL ENDING")
			logger.info("Detected poll ending", { event: event })
			if (t.last_poll.result_received && t.last_poll.id == event.id) {
				// console.log("DOUBLE POLL RESULT DETECTED")
				logger.info("Double poll detected", { event: event })
				return;
			}
			if (event.status == 'archived') {
				logger.debug("Archived poll received");
				return;
			}
			if (t.last_poll.id != event.id || (t.last_poll.id == event.id && !t.last_poll.result_received)) {
				logger.debug("Received valid poll", { event: event, choices: event.choices })
				// console.log(event)
				// console.log(event.choices)
				logger.debug("Starting sorter");
				let base_choice = { votes: -1 }
				var winner = event.choices.reduce((a, c) => {
					if (Array.isArray(a)) {
						// console.log("Sorting hit array")
						logger.debug("Sorting with array (tie for the lead)", a)
						var ac = a[0]
						if (ac.votes == c.votes) {
							logger.debug(`Tied, pushing ${c} to ${a}`, c, a)
							a.push(c)
							return a
						}
						return ac.votes < c.votes ? c : ac
					} else {
						if (c.votes == a.votes) {
							// console.log("Sorting created to array")
							logger.debug("Tied, creating array", a, c)
							return [a, c]
						}
						return a.votes < c.votes ? c : a
					}
				}, base_choice)
				console.log(`Winner: ${winner}`)
				logger.info(`Poll winner: ${winner}`, { event: event })
				t.last_poll.result_received = true;
				logger.info("Sending message POLL:END to main menu", { winner: winner })
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
	logger.info("Setting up ipcMain event handlers")
	ipcMain.handle('ping', () => 'pong')
	logger.verbose("Added listener on ping")

	ipcMain.on('READ_FILE', (event, payload) => {
		const content = fs.readFileSync(payload.path);
		logger.debug("READ_FILE EVENT", payload, content)
		event.reply('READ_FILE', { content });
	});
	logger.verbose("Added listener on READ_FILE")

	ipcMain.on('CHOOSE', (event, payload) => {
		// const content = fs.readFileSync(payload.path);
		let response;
		// console.log(payload)
		logger.debug("CHOOSE", payload)
		payload = JSON.parse(payload)
		let o;
		if (payload.choice == 'R') {
			// console.log("Random")
			o = "Random"
			response = current_path.choose_random(payload.options)
		} else {
			o = `Chose ${payload.choice}`
			response = current_path.choose(payload.choice)
		}
		logger.debug("CHOOSE EVENT", { chose: o, event: event, payload: payload, response: response, current_path: current_path.toString() })

		event.reply('CHOOSE', response);
		// event.reply('STATUS', current_path.statistics)
	});
	logger.verbose("Added listener on CHOOSE")

	ipcMain.on('SAVE', (event, payload) => {
		var i = current_path.save_completed();
		logger.debug("SAVE EVENT", { "saved path": i, "shadowpath stats": current_path.statistics })
		event.reply('SAVE', i)
		event.reply('STATUS', current_path.statistics)

	})
	logger.verbose("Added listener on SAVE")

	ipcMain.on('STATUS', (event, payload) => {
		logger.debug("STATUS EVENT", { event: event, payload: payload, current_path: current_path.statistics })
		event.reply('STATUS', current_path.statistics)
	})
	logger.verbose("Added listener on STATUS")

	ipcMain.on('RESET', (event, payload) => {
		current_path.reset();
		logger.debug("RESET EVENT", { current_path: current_path, current_path_statistics: current_path.statistics })
		event.reply('STATUS', current_path.statistics)
	})
	logger.verbose("Added listener on RESET")

	ipcMain.on('POLL:START', (event, payload) => {
		let poll = twitch_app.createPoll(payload.title ? payload.title : `Route for level ${current_path.length + 1}`, current_path.show_choices_text(), payload.duration ? payload.duration : 15);
		// poll.start()
		// res.send(poll.data)
		logger.debug("POLL:START EVENT", { poll: poll, current_path_statistics: current_path.statistics })
		event.reply('POLL:STARTED', current_path.statistics)
	})
	logger.verbose("Added listener on POLL:START")
	ipcMain.on("BUG", (event, payload) => {
		let e = fetch(
			"http://dev.shadowlerone.ca/log.php", {
			method: 'POST',
			body: new URLSearchParams({
				log_title: `Bug reported by ${twitch_app.User.display_name} log at ${Date.now()}`,
				log: JSON.stringify(
					readFileSync(userDataFolder('combined.log'))
				)
			}),
			headers: { "Content-Type": "application/x-www-form-urlencoded", }
		}
		).then(
			(e) => {
				console.log(e)
				event.reply("REPORTED", {})
			}
		)
	})
	logger.verbose("Added listener on BUG")

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
let completed_fp = userDataFolder('completed.json');
if (!fs.existsSync(completed_fp)) {
	logger.warn("completed database not found, copying from internal files", { "completed filepath": completed_fp })
	fs.writeFileSync(completed_fp,
		fs.readFileSync(path.resolve(__dirname, 'data', 'completed.json'))
		, 'utf-8')
}
logger.info("Found data files", { "table filepath": table_fp, "completed filepath": completed_fp })

let current_path = new ShadowPath(table_fp, completed_fp);
logger.info("Initialized ShadowPath", current_path)
//#endregion

// DASHBOARD STUFF


//#region Twitch Auth

import { TWITCH_CLIENT_ID, Twitch } from './twitch.js'
let STATE;
let TOKEN
const twitch_app = new Twitch(TWITCH_CLIENT_ID);

function authenticate(state, url) {
	STATE = state;
	logger.info("Starting Authentication sequence")
	shell.openExternal(url)
}


twitch_app.authenticate(authenticate);
// console.log("Called authenticate")
logger.info("Called authenticator")


//#endregion

const express = require('express')
import morgan from 'morgan';
import { readFile, readFileSync } from 'node:fs';

// WEBSERVER STUFF
//#region WEBSERVER STUFF
logger.info("Setting up webserver")


const morganMiddleware = morgan(
	function (tokens, req, res) {
		return JSON.stringify({
			method: tokens.method(req, res),
			url: tokens.url(req, res),
			status: Number.parseFloat(tokens.status(req, res)),
			content_length: tokens.res(req, res, 'content-length'),
			response_time: Number.parseFloat(tokens['response-time'](req, res)),
		});
	},
	{
		stream: {
			// Configure Morgan to use our custom logger with the http severity
			write: (message) => {
				const data = JSON.parse(message);
				logger.http(`incoming-request`, data);
			},
		},
	}
);
const express_app = express()
const port = config.port ? config.port : 3000

express_app.use(express.json())

express_app.use(morganMiddleware);

express_app.get('/auth', (req, res) => {
	res.sendFile('auth_success.html', {
		root: path.join(__dirname, 'public')
	})
	logger.verbose("Received request at /auth", { request: req, response: res })
})
express_app.post('/set_token', (req, res) => {
	// console.log(req.body)
	logger.debug("Received /set_token", req.body)
	if (STATE != req.body.state) {
		logger.warn(`STATES DON'T MATCH; ${req.body.state} != ${STATE}`, { request_body: req.body, request_state: req.body.state, state: STATE })
		// logger.warn(`${req.body.state} != ${STATE}`)
	}
	TOKEN = req.body.token;
	logger.debug("Set token")
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
	// console.log(`Example app listening on port ${port}`)
	logger.info(`Shadow tracker running on port ${3000}`)
})
//#endregion