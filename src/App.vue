<template>
	<div>
		<div v-if="status != undefined">
			<h2>Current Path</h2>
			<div class="level-container">
				<template v-for="c in status.current_path">
					<div class="level" :class="c">{{ c }}</div>
				</template>
				<template v-if="status.current_path.length == 0">
					<div class="level">Path not started!</div>
				</template>
			</div>

		</div>
		<div v-if="status != undefined">
			<!-- <div>Current Path: {{ status.current_path_string }}</div> -->
			<div>Path number: {{ status.current_path_number }}</div>
			<!-- <div v-if="status.current_path_number != 'Unconfirmed'">Path name: {{  }}</div> -->
		</div>

	</div>
	<template v-if="status != undefined && status.current_path.length < 6">
		<h2>Controls</h2>
		<div class="btn-container" v-if="status != undefined">
			<button class="dark btn" v-if="status.potential_choices.includes('D')" @click="choose('D')">Dark</button>
			<button class="neutral btn" v-if="status.potential_choices.includes('N')"
				@click="choose('N')">Neutral</button>
			<button class="hero btn" v-if="status.potential_choices.includes('H')" @click="choose('H')">Hero</button>
		</div>
	</template>

	<h2>Poll</h2>
	<div class="group no-radius">
		<!-- <label>
			Poll Title
		</label> -->
		<div class="flex">
			<input :disabled="poll_running || poll_disabled" placeholder="Poll Title" class="input"
				:value="poll_title" />
			<input :disabled="poll_running || poll_disabled" placeholder="Poll Duration" type="number" min="15"
				max="300" class="input" :value="poll_duration" />
			<button :disabled="poll_running || poll_disabled" class="btn" @click="startPoll()">Start Poll</button>
		</div>
		<div class="btn-container" v-if="poll_result">
			<template v-if="Array.isArray(poll_result)">
				<button v-for="w in poll_result" @click="choose(w.title[0])" class="level btn no-radius"
					:class="w.title">
					{{ w.title }}
				</button>
			</template>
			<template v-else>
				<button @click="choose(poll_result.title[0])" class="level btn no-radius" :class="poll_result.title">
					{{ poll_result.title }}
				</button>
			</template>
			<!-- {{ poll_result }} -->
		</div>
	</div>


	<h2>Admin</h2>
	<div class="btn-container">
		<button class='btn' @click="save()">Save</button>
		<button class='btn' @click="save_reset()">Save and Reset</button>
		<button class='btn' @click="reset()">Reset</button>
	</div>
	<h2>Stats</h2>
	<button class="btn" :class="{ activated: showStats }" @click="showStats = !showStats">Toggle Stats</button>
	<div v-if="status && showStats" class="stats">
		<h2>Progression</h2>
		<table>
			<thead>
				<tr>
					<th>Paths Completed</th>
					<th>Paths Left</th>
					<th>Choices Left</th>
					<th>Percentage Completed</th>
					<th>Days Left</th>
					<!-- <th>Days Left</th> -->
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>{{ status.completed }}</td>
					<td>{{ status.paths_left }}</td>
					<td>{{ status.paths_left * 6 }}</td>
					<td>{{ status.percentage_completed.toFixed(2) + '%' }}</td>
					<td>{{ status.days_left }}</td>
				</tr>
			</tbody>
		</table>

		<h2>Possible paths given current run:</h2>
		<button class="btn slim" :class="{ activated: showLevels }" @click="showLevels = !showLevels">Toggle
			Levels</button>
		<table>
			<thead>
				<tr>
					<th rowspan="2">Number</th>
					<th rowspan="2">Name</th>
					<th rowspan="2">Path</th>

					<template v-if="showLevels">
						<th rowspan="1" colspan="7">Levels</th>
					</template>
				</tr>

				<tr v-if="showLevels">
					<th>1</th>
					<th>2</th>
					<th>3</th>
					<th>4</th>
					<th>5</th>
					<th>6</th>
					<th>Boss</th>
				</tr>

			</thead>
			<tbody>
				<tr v-for="uv in status.unvisited_paths">
					<td>{{ uv.NUMBER }}</td>
					<td>{{ uv.NAME }}</td>
					<td>{{ uv.MISSION }}</td>
					<template v-if="showLevels">
						<td>{{ uv["STAGE 1"] }}</td>
						<td>{{ uv["STAGE 2"] }}</td>
						<td>{{ uv["STAGE 3"] }}</td>
						<td>{{ uv["STAGE 4"] }}</td>
						<td>{{ uv["STAGE 5"] }}</td>
						<td>{{ uv["STAGE 6"] }}</td>
						<td>{{ uv["BOSS"] }}</td>
					</template>

				</tr>
			</tbody>
		</table>
	</div>

	<!-- <div>
		<p>{{ status }}</p>
	</div> -->
	<!-- 	<div>
		<button>Start Poll</button>
	</div> -->
</template>

<script setup>


import { useTemplateRef, ref, onMounted, computed } from 'vue'

let status = ref();
let poll_result = ref();
let poll_running = ref(false);
let poll_disabled = ref(false);
let showStats = ref(false)
let showLevels = ref(true)

let poll_title = ref('')
let poll_duration = ref(120)
// const poll_title = useTemplateRef('poll-title')
// const poll_button = useTemplateRef
// const poll_duration = useTemplateRef('poll-duration')

onMounted(() => {
	window.ipc.on('READ_FILE', (payload) => {
		console.log(payload.content);
	});
	window.ipc.on('CHOOSE', (payload) => {
		console.log(`choose ${payload ? "succeeded" : "failed"}`)
		window.ipc.send('STATUS')
	})
	window.ipc.on('POLL:END', (payload) => {
		console.log(payload)
		poll_result.value = payload
		poll_running.value = false;
	})

	window.ipc.on('STATUS', (payload) => {
		// TODO
		status.value = payload;
		console.log(status.value)



		if (status.value.current_path.length < 6) {
			// poll_title.value.disabled = false;
			poll_disabled = false;
			poll_title.value = `Route for level ${status.value.current_path.length + 1}`
		} else {
			poll_disabled = true;

			// poll_title.value.disabled = true;
		}

		console.log(`Potential Choices ${status.value.potential_choices}`)
		if (status.value.potential_choices.length < 2) {
			console.log("disabling polls. too few choices")
			poll_disabled = true;
		}
	})
	window.ipc.on('SAVE', (payload) => {
		// TODO
		if (payload > 0) {
			alert(`Saved! Path ${payload} added to completed list!`);
		} else {
			alert('Saved!')
		}
	})
	window.ipc.send('STATUS')
})


function choose(option) {
	console.log(`choosing ${option}`)
	poll_result.value = undefined;
	const payload = option
	window.ipc.send('CHOOSE', payload)
	window.ipc.send('STATUS')
}

function save() {
	window.ipc.send('SAVE', {})
}
function save_reset() {
	save();
	_reset();
}

function startPoll() {
	window.ipc.send('POLL:START', { title: poll_title.value, duration: 120 })
	poll_running.value = true;

}
function reset() {
	if (confirm("Reset without saving?")) {
		_reset()
	}
}
function _reset() {
	poll_result.value = ''
	window.ipc.send('RESET', {})
}

console.log('👋 This message is being logged by "App.vue", included via Vite');
</script>

<style lang="css">
/*
  Enter and leave animations can use different
  durations and timing functions.
*/
.slide-fade-enter-active {
	transition: all 300ms ease-out;
}

.slide-fade-leave-active {
	transition: all 200ms cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
	transform: translateY(20px);
	opacity: 0;
}
</style>