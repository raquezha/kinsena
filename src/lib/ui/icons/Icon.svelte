<script lang="ts">
	import { ICON_PATHS, type IconName } from './paths.ts';

	let {
		name,
		size = 22,
		stroke = 2
	}: { name: IconName; size?: number; stroke?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	<path d={ICON_PATHS[name]} />
</svg>
