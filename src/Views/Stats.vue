<template>
	<h2>Stats</h2>
	<!-- <button class="btn" :class="{ activated: showStats }" @click="showStats = !showStats">Toggle Stats</button> -->
	<div v-if="status != undefined" class="stats">
		<h2>Progression</h2>
		<LevelsTable :paths="status.unvisited_paths" :show-levels="showLevels"/>

		<h2>Possible paths given current run:
			{{ status.unvisited_paths.length }}
		</h2>
		<button class="btn slim" :class="{ activated: showLevels }" @click="showLevels = !showLevels">Toggle
			Levels</button>
		
	</div>
</template>
<script setup>
import { useTemplateRef, ref, onMounted, computed, defineProps } from 'vue'
import LevelsTable from '../components/LevelsTable.vue'
let showStats = ref(true)
let showLevels = ref(false)

const { status } = defineProps(['status'])

</script>