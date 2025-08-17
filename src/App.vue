<template>
	<!-- <div class="header">
		<button @click="report_bug()">Report Bug</button>
	</div> -->
	<div id="navigation" class="btn-container v">
		<!-- Navigation -->
		<button class="btn l-btn" @click="tab = 0">Twitch</button>
		<button class="btn l-btn" @click="tab = 1">Stats</button>
		<button class="btn l-btn">Admin</button>
		<button class="btn l-btn">Settings</button>
	</div>
	<div id="content">
		<template v-if="tab == 0">
			<Twitch :status="status" :poll_result="poll_result" :poll_disabled="poll_disabled"
				:poll_running="poll_running" :poll_title="poll_title" @save="save" @save_reset="save_reset"
				@reset="reset" @choose="choose" @startPoll="startPoll" />
		</template>
		<template v-else-if="tab == 1">
			<Stats :status="status" />
		</template>

		<!-- <div>
		<p>{{ status }}</p>
	</div> -->
		<!-- 	<div>
		<button>Start Poll</button>
	</div> -->
	</div>

</template>

<script setup>


import { useTemplateRef, ref, onMounted, computed } from 'vue'
import Stats from './Views/Stats.vue'
import Twitch from './Views/Twitch.vue';
let status = ref();
let poll_result = ref();
let poll_running = ref(false);
let poll_disabled = ref(false);

let tab = ref(0)
let tabs = ref([
	Twitch,
	Stats
])

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
		poll_result.value = undefined;

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
	let ties = [];
	if (option == 'R' && poll_result.value && Array.isArray(poll_result.value)) {
		ties = poll_result.value.map(e => e.title[0])
	}
	console.log(ties)
	// const payload = { choice: option, options: ties };
	window.ipc.send('CHOOSE', JSON.stringify({ choice: option, options: ties }))
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
	window.ipc.send('POLL:START', { title: poll_title.value, duration: poll_duration.value })
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


function report_bug() {
	window.ipc.send('BUG', {})
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