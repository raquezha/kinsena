<script lang="ts">
	import { ICON_SVG, type IconName } from './paths.ts';

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
	<!-- Trusted Lucide path markup from ICON_SVG; never user input. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html ICON_SVG[name]}
</svg>
