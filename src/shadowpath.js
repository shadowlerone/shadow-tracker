
import path from 'node:path';
const fs = require('fs');

// console.log(`table: ${table}`)
// console.log(table);

const OPTIONS = ["D", "N", "H"]

class ShadowPath {
	/* constructor(parameters) {
		
	} */
	static CHOICE_MAP = {
		'D': "Dark",
		'N': 'Neutral',
		'H': 'Hero'
	}
	choices;
	table_fp;
	completed_fp;
	table;
	completed;
	constructor(
		table_fp = path.resolve(__dirname, 'data', 'table.json'),
		completed_fp = path.resolve(__dirname, 'data', 'completed.json')
	) {
		// DATA STUFF
		this.table_fp = table_fp
		this.completed_fp = completed_fp
		this.table = require(table_fp)
		this.completed = require(completed_fp)
		this.choices = []
	}
	get length() {
		return this.choices.length;
	}


	get status() {
		return {
			current_path_string: this.toString(),
			current_path: this.choices,
			potential_choices: this.show_choices(),
			potential_paths_count: this.unvisited_paths().length,
			completed: this.completed.length,
			paths_left: this.table.length - this.completed.length,
			percentage_completed: 100 * this.completed.length / this.table.length,
			current_path_number: this.find_current_matching_paths().length == 1 ? `${this.find_current_matching_paths()[0].NUMBER} - ${this.find_current_matching_paths()[0].NAME}` : "Unconfirmed"
		}
	}

	get statistics() {
		return Object.assign({},
			this.status,
			{
				days_left: (this.table.length - this.completed.length) / 24,
				unvisited_paths: this.unvisited_paths()
			}
		)
	}

	// valid options = D, N, H
	verify() {
		for (let i = 0; i < this.choices.length && i < 6; i++) {
			if (
				!OPTIONS.includes(this.choices[i])
			) {
				console.warn(`Choice at index ${i} is invalid.`)
				this.choices = this.choices.slice(0, i);
				console.warn(`choices: ${this.choices}`)
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

	reset() {
		this.choices.length = 0;
	}

	choose(option) {
			if (!OPTIONS.includes(option[0].toUpperCase())) {
			// console.log(`Option ${option} not in OPTIONS`)
			return false;
		}
		if (!this.show_choices().includes(option)) {
			return false;
		}
		this.choices.push(option);
		this.verify();
		return true;
	}
	choose_random(choices  = []){
		console.log(choices)
		if (choices.length == 0){
			choices = this.show_choices();
		}
		console.log(choices)
		
		var choice = choices[Math.floor(Math.random() * choices.length)];
		console.log(choice)
		return this.choose(choice)
	}

	find_current_matching_paths() {
		return this.table.filter(
			row => row.MISSION.slice(0, this.toString().length) == this.toString()
		)

	}
	find_unvisited_paths(paths) {
		return paths.filter(
			row => !(row.DONE || this.completed.includes(parseInt(row.NUMBER)))
		)
	}

	find_visited_paths() {
		return this.table.filter(
			row => (row.DONE || this.completed.includes(parseInt(row.NUMBER)))
		)
	}

	unvisited_paths() {
		return this.find_current_matching_paths().filter(
			row => !(this.completed.includes(parseInt(row.NUMBER)))
		)

	}

	show_choices() {
		if (this.length >= 6) {
			return []
		}
		let uv = this.unvisited_paths();
		let index = this.length < 5 ? this.length : 6;
		// console.log(uv.length)
		let choices = Array.from(new Set(uv.map(row => row.MISSION[index])));
		// console.log(`Choices length: ${choices.length}`)
		return choices;
	}

	show_choices_text() {
		return this.show_choices().map(e => ShadowPath.CHOICE_MAP[e])
	}

	save_completed() {
		var o = 0;
		if (this.find_current_matching_paths().length == 1) {
			var n = parseInt(this.find_current_matching_paths()[0].NUMBER)
			if (!this.completed.includes(n)) {
				this.completed.push(n);
				o = n;
			}
		}
		try {
			
			fs.writeFileSync(this.completed_fp, JSON.stringify(this.completed), {encoding: 'utf8'})
		} catch {
			// alert(`failed to write to main path: ${this.completed_fp}`)
			console.error(`failed to write to main path: ${this.completed_fp}`)
			// fs.writeFileSync('backup_'+this.completed_fp, JSON.stringify(this.completed), {encoding: 'utf8'})
		}
		return o
	}
}

export default ShadowPath