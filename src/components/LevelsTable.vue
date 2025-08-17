<template>
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
			<tr v-for="uv in paths">
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
</template>
<script setup>
import { useTemplateRef, ref, onMounted, computed, defineProps } from 'vue'
const { paths, showLevels } = defineProps(['paths', 'showLevels'])

</script>