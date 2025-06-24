const debug_div = document.getElementById("debug");

const input_map = {
	"current_path_string": 'data-current-path',
	"completed":"data-paths-completed",
	'percentage_completed': 'data-percent-complete',
	'paths_left':'data-paths-left'
}

const dark_possible = document.getElementById('data-dark-possible');
const neutral_possible = document.getElementById('data-neutral-possible');
const hero_possible = document.getElementById('data-hero-possible');

async function update() {
	const response = await fetch("/")
	if (!response.ok) {
    //   throw new Error(`Response status: ${response.status}`);
		console.error(`Response status: ${response.status}`)
    }
	const json = await response.json();
    console.log(json);
	let i = json;
	i.time = Date.now();
	debug_div.textContent = JSON.stringify(i, undefined, 2);

	console.debug("Updating options")
	updatePossible(i.potential_choices)
	i.percentage_completed = i.percentage_completed.toFixed(2) + '%'
	Object.keys(i)
		.filter(e => e in input_map)
		// .map(e => [e, input_map[e]])
		.forEach((e) =>{
			/* console.debug(e)
			console.debug(input_map[e])
			console.debug(i[e]) */
			let id = input_map[e]
			let v = i[e]
			console.debug(`e: ${e}; id: ${id}; value: ${v}`)
			setValue(id, v)
		})
}


function updatePossible(possible){
	if (possible.includes("H")){
		hero_possible.classList.remove("hidden")
	} else {
		hero_possible.classList.add("hidden")
	}
	if (possible.includes("D")){
		dark_possible.classList.remove("hidden")
	} else {
		dark_possible.classList.add("hidden")
	}
	if (possible.includes("N")){
		neutral_possible.classList.remove("hidden")
	} else {
		neutral_possible.classList.add("hidden")
	}
}
function setValue(element_id, value){
	document.getElementById(element_id).innerText = value;
}
update();
setInterval(update, 1000)