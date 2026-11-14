<script lang="ts">
	/** The Kinsena mark: the four-block K in brushed titanium gold on an obsidian tile. */
	let { size = 40, animate = false }: { size?: number; animate?: boolean } = $props();

	const id = $props.id();
	const BLOCKS = [
		'M112 112H240V240H112Z',
		'M302 112H390V200A40 40 0 0 1 350 240H302A40 40 0 0 1 262 200V152A40 40 0 0 1 302 112Z',
		'M112 262H240V390H112Z',
		'M302 262H350A40 40 0 0 1 390 302V390H302A40 40 0 0 1 262 350V302A40 40 0 0 1 302 262Z'
	];
</script>

<svg
	class="logo"
	class:animate
	viewBox="0 0 512 512"
	width={size}
	height={size}
	aria-hidden="true"
	focusable="false"
>
	<defs>
		<radialGradient id="{id}-canvas" cx="50%" cy="35%" r="70%">
			<stop offset="0" stop-color="#191610" />
			<stop offset="0.6" stop-color="#0a0907" />
			<stop offset="1" stop-color="#040403" />
		</radialGradient>
		<linearGradient id="{id}-gold" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#fff6e2" />
			<stop offset="0.25" stop-color="#ecd39d" />
			<stop offset="0.65" stop-color="#cda863" />
			<stop offset="1" stop-color="#9a7637" />
		</linearGradient>
	</defs>
	<rect width="512" height="512" rx="116" fill="url(#{id}-canvas)" />
	<rect
		x="18"
		y="18"
		width="476"
		height="476"
		rx="100"
		fill="none"
		stroke="#cda863"
		stroke-opacity="0.2"
		stroke-width="4"
	/>
	<g fill="url(#{id}-gold)" transform="translate(5 5)">
		{#each BLOCKS as d, index (d)}
			<path class="block" style:--i={index} {d} />
		{/each}
	</g>
</svg>

<style>
	.logo {
		display: block;
		border-radius: 23%;
		flex: none;
	}

	.block {
		transform-box: fill-box;
		transform-origin: center;
	}

	.animate .block {
		animation: block-in 520ms calc(var(--i) * 70ms) var(--ease-spring) both;
	}

	@keyframes block-in {
		from {
			transform: scale(0.3);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animate .block {
			animation: none;
		}
	}
</style>
