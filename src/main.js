import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

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

// DATA STUFF
const fs = require('fs');
// const path = require('path');
const csv = require('fast-csv');

let table = []

fs.createReadStream(path.resolve(__dirname, 'data', 'paths.csv'))
	.pipe(csv.parse({ headers: true }))
	.on('error', error => console.error(error))
	.on('data', row => table.push(row))
	.on('end', rowCount => console.log(`Parsed ${rowCount} rows (${table.length})`));

let completed = require(path.resolve(__dirname, 'data', 'completed.json'))

console.log(completed)


// LOGIC Stuff

const OPTIONS = ["D", "N", "H"]

class ShadowPath {
	/* constructor(parameters) {
		
	} */
	choices;

	constructor() {
		this.choices = []
	}
	// valid options = D, N, H
	verify() {
		for (let i = 0; i < this.choices.length && i < 6; i++) {
			if (
				!OPTIONS.includes(this.choices[i])
			) {
				console.log(`Choice at index ${i} is invalid.`)
				this.choices = this.choices.slice(0, i);
				console.log(`choices: ${this.choices}`)
				break;
			}
		}
	}
	toString() {
		// console.log(this.choices)
		var out = this.choices.slice(0, 5).join("");
		if (this.choices.length >= 6) {
			out += `(${this.choices[5]})`
		}
		return out;
	}

	choose(option) {
		if (!OPTIONS.includes(option)) {
			console.log(`Option ${option} not in OPTIONS`)
			return;
		}
		this.choices.push(option);
		this.verify();
	}
}


console.log(table[0])



function find_current_matching_paths(shadow_path) {
	return table.filter(
		row => row.MISSION.slice(0, shadow_path.choices.length) == shadow_path.toString()
	)
}

function find_unvisited_paths(t) {
	return t.filter(
		row => !(row.DONE || completed.includes(parseInt(row.NUMBER)))
	)
}


function find_visited_paths(t) {
	return t.filter(
		row => (row.DONE || completed.includes(parseInt(row.NUMBER)))
	)
}

let sp = new ShadowPath()
/* 
for (let i = 0; i < 4; i++){
	sp.choose("H");
} */

sp.choose("H")
sp.choose("H")
sp.choose("D")

// WEBSERVER STUFF

const express = require('express')
const express_app = express()
const port = 3000

express_app.get('/', (req, res) => {
	res.send(sp.toString())
})
express_app.get('/table', (req, res) => {
	res.send(table[0])
})
express_app.get('/unvisited', (req, res) => {
	res.send(
		find_unvisited_paths(
			find_current_matching_paths(sp)
		)

	)
})

express_app.get("/current_paths", (req, res) => {
	res.send(find_current_matching_paths(sp))
})
express_app.get('/visited', (req, res) => {
	res.send(
		find_visited_paths(
			table
		)

	)
})
express_app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
