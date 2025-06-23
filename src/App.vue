<template>
	<div>
		<h2>
			Stats
		</h2>
		<div>
			<div>Current Path</div>
			<div>HHD</div>
		</div>
		<h2>Controls</h2>
		<div>
			<div>Current Path</div>
			<div>HHD</div>
		</div>

	</div>
	<div>
		<button ref="button-" @click="choose('D')">Dark</button>
		<button ref="button-" @click="choose('N')">Neutral</button>
		<button ref="button-" @click="choose('H')">Hero</button>
	</div>
	<div>
		<button @click="save()">Save</button>
	</div>
	<!-- 	<div>
		<button>Start Poll</button>
	</div> -->
</template>

<script setup>


import { ref, onMounted } from 'vue'

onMounted(() => {
	window.ipc.on('READ_FILE', (payload) => {
		console.log(payload.content);
	});
	window.ipc.on('CHOOSE', (payload) => {
		console.log(`choose ${payload ? "succeeded" : "failed"}`)
	})
	window.ipc.on('POLL:END', (payload) => {
		console.log(payload)
	} )

	window.ipc.on('STATUS', (payload) => {
		// TODO
	})
})
function choose(option) {
	console.log(`choosing ${option}`)
	const payload = option
	window.ipc.send('CHOOSE', payload)
}

function save() {
	window.ipc.send('SAVE', {})
}

console.log('👋 This message is being logged by "App.vue", included via Vite');
</script>