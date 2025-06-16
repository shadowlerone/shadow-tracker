//#region Authentication Stuff
const TWITCH_CLIENT_ID = '9tyuis3g12cc9s8ywl6ript45vj50r';
const TWITCH_SECRET = '<YOUR CLIENT SECRET HERE>';
const SESSION_SECRET = '<SOME SECRET HERE>';
const CALLBACK_URL = 'http://localhost:3000/auth/twitch/callback';  // You can run locally with - http://localhost:3000/auth/twitch/callback


const SCOPES = [
	"moderator:manage:announcements",
	"channel:manage:polls",
	// "channel:read:polls",

]

const AUTH_DATA = {
	client_id: TWITCH_CLIENT_ID,
	redirect_uri: 'http://localhost:3000/auth',
	response_type: 'token',
	scope: SCOPES.join(' '),
}

const querystring = require('node:querystring');


// const AUTH_URL = `https://id.twitch.tv/oauth2/authorize?${querystring.stringify(AUTH_DATA)}`
function AUTH_URL(state) {
	let a = Object.assign({}, AUTH_DATA, { state: state })
	return `https://id.twitch.tv/oauth2/authorize?${querystring.stringify(a)}`;
}

class EndPoint {
	url;
	last_request = -1;
	_data;
	constructor(URL, headers = {}, method = 'GET') {
		this.url = URL
		this.headers = headers;
		this.method = method;
	}
	get body() {
		return {}
	}

	get data() {
		// this.data = await get();
		return (async () => {
			try {
				return await get();
			} catch (e) {
				return {};
			}
		})();
	}

	async get() {
		try {
			console.debug("Sending request from EndPoint")
			let options = {
				method: this.method,
				headers: this.headers,
			}
			if (this.method == 'POST') {

				options.body = JSON.stringify(this.body)
				console.log(options.body)
			}
			const response = await fetch(this.url,
				options
			)
			if (!response.ok) {
				response.text().then(e => console.log(e))
				throw new Error(`Response status: ${response.status}.`);
			}
			console.log("Received okay!")
			let data = await response.json();
			if (data.length > 1) {
				console.warn("More than one result in data. This may be normal, but in this codebase it is considered anomalous.")
			}
			console.log(`Data`)
			console.log(data)
			console.log(data.data[0])
			this._data = data.data[0];
			console.log(this._data)
			this.last_request = Date.now();
			return this._data;
		} catch (error) {
			this.last_request = -1;
			console.error(error.message);
		}
	}
}


class CachedEndpoint extends EndPoint {
	// cached = false;
	expires;
	lifetime;


	constructor(URL, headers = {}, method = 'GET', expires = false, lifetime = 5 * 60,) {
		super(URL, headers, method)
		this.expires = expires
		this.lifetime = lifetime;
	}
	get cached() {
		if (this.last_request < 0) {
			return false;
		}
		if (!this.expires) {
			return true;
		}
		const ms = Date.now() - this.last_request;
		return Math.floor(ms / 1000) < this.lifetime;
	}
	get data() {
		// this.data = await get();
		if (this.cached && this._data != undefined) {
			console.debug(`Cache hit in endpoint ${this.url}!`)
			console.debug(`Data from cache hit: ${this._data}!`)
			return this._data;
		}
		console.debug(`Cache miss in endpoint ${this.url}. Fetching...`)
		// console.debug("Sending request from CachedEndPoint...")
		return (async () => {
			try {
				return await get();
			} catch (e) {
				return {};
			}
		})();
	}
}

class User extends CachedEndpoint {
	constructor(headers = {}) {
		super('https://api.twitch.tv/helix/users', headers = headers)
	}

	get id() { return this.data.id; }

	get login() { return this.data.login; }
	get display_name() { return this.data.display_name; }
	get type() { return this.data.type; }
	get broadcast_type() { return this.data.broadcast_type; }
	get description() { return this.data.description; }
	get profile_image_url() { return this.data.profile_image_url; }
	get offline_image_url() { return this.data.offline_image_url; }
	get created_at() { return this.data.created_at; }


	// Conditionals
	isAffiliate() { return this.broadcast_type === 'affiliate' }
}

class Poll extends CachedEndpoint {
	started = false;
	constructor(user, headers, title, choices, duration = 120) {
		super(
			'https://api.twitch.tv/helix/polls',
			Object.assign({}, headers, { 'Content-Type': 'application/json' }),
			'POST',
		)

		this._broadcaster_id = user.id;
		this._title = title;
		this._choices = choices;
		this._duration = duration; // default 2 minutes
	}

	get body() {
		return {
			broadcaster_id: this._broadcaster_id,
			title: this._title,
			choices: this._choices.map((e) => { return { title: e } }),
			duration: this._duration
		}
	}

	async start() {
		let d = await this.get();
		if (d != undefined) {
			this.started = true;
		}
	}
	get id() { return this.data.id }
	get broadcast_id() { return this.started ? this.data.broadcast_id : this._broadcast_id }
	get broadcaster_name() { return this.started ? this.data.broadcaster_name : null }
	get broadcaster_login() { return this.started ? this.data.broadcaster_login : null }
	get title() { return this.started ? this.data.title : this._title }
	get choices() { return this.started ? this.data.choices : this._choices }
	get status() { return this.started ? this.data.status : 'INVALID' }// maybe set to 'INVALID'
	get duration() { return this.started ? this.data.duration : this._duration }
}


//#endregion

export {
	EndPoint, CachedEndpoint, User, Poll,
	AUTH_URL, TWITCH_CLIENT_ID, // authorize,
}