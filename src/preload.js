// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron')

/* contextBridge.exposeInMainWorld('versions', {
	node: () => process.versions.node,
	chrome: () => process.versions.chrome,
	electron: () => process.versions.electron,
	ping: () => ipcRenderer.invoke('ping'),
	
	// we can also expose variables, not just functions
}) */


const validChannels = [
	'READ_FILE', 'WRITE_FILE', 
	'CHOOSE', 'SAVE', 
	'POLL:START','POLL:END',
	'STATUS',
	'RESET',
	'RANDOM_PATH'
];
contextBridge.exposeInMainWorld(
	'ipc', {
	send: (channel, data) => {
		if (validChannels.includes(channel)) {
			ipcRenderer.send(channel, data);
		}
	},
	on: (channel, func) => {
		if (validChannels.includes(channel)) {
			// Strip event as it includes `sender` and is a security risk
			ipcRenderer.on(channel, (event, ...args) => func(...args));
		}
	},
},
);