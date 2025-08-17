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
		<div class="btn-container h" v-if="status != undefined">
			<button class="dark btn" v-if="status.potential_choices.includes('D')"
				@click="$emit('choose', 'D')">Dark</button>
			<button class="neutral btn" v-if="status.potential_choices.includes('N')"
				@click="$emit('choose', 'N')">Neutral</button>
			<button class="hero btn" v-if="status.potential_choices.includes('H')"
				@click="$emit('choose', 'H')">Hero</button>
		</div>
	</template>

	<h2>Poll</h2>
	<div class="group no-radius">
		<div class="flex">
			<input :disabled="poll_running || poll_disabled" placeholder="Poll Title" class="input"
				:value="poll_title" />
			<input :disabled="poll_running || poll_disabled" placeholder="Poll Duration" type="number" min="15"
				max="300" class="input" :value="poll_duration" />
			<button :disabled="poll_running || poll_disabled" class="btn" @click="$emit('startPoll')">Start
				Poll</button>
		</div>
		<div class="btn-container h" v-if="poll_result">
			<template v-if="Array.isArray(poll_result)">
				<button v-for="w in poll_result" @click="$emit('choose', w.title[0])" class="level btn no-radius"
					:class="w.title">
					{{ w.title }}
				</button>
				<button @click="$emit('choose', 'R')" class="level btn no-radius">
					Random!
				</button>
			</template>
			<template v-else>
				<button @click="$emit('choose', poll_result.title[0])" class="level btn no-radius"
					:class="poll_result.title">
					{{ poll_result.title }}
				</button>
			</template>
		</div>
	</div>


	<h2>Admin</h2>
	<div class="btn-container h">
		<button class='btn' @click="$emit('save')">Save</button>
		<button class='btn' @click="$emit('save_reset')">Save and Reset</button>
		<button class='btn' @click="$emit('reset')">Reset</button>
	</div>
</template>
<script setup>
import { useTemplateRef, ref, onMounted, computed, defineProps } from 'vue'

const { status } = defineProps(['status', 'poll_result', 'poll_running', 'poll_disabled', 'poll_title'])
const emit = defineEmits(
	[
		'save',
		'save_reset',
		'reset',
		'choose',
		'startPoll'
	]
)

let poll_duration = ref(120)

</script>