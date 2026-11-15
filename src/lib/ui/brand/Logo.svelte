<script lang="ts">
	/** The Kinsena mark: the four-block K in jeepney primaries on a navy tile. */
	let { size = 40, animate = false }: { size?: number; animate?: boolean } = $props();

	const BLOCKS = [
		{ d: 'M112 112H240V240H112Z', fill: 'var(--brand-red)' },
		{
			d: 'M302 112H390V200A40 40 0 0 1 350 240H302A40 40 0 0 1 262 200V152A40 40 0 0 1 302 112Z',
			fill: 'var(--accent)'
		},
		{ d: 'M112 262H240V390H112Z', fill: 'var(--brand-green)' },
		{
			d: 'M302 262H350A40 40 0 0 1 390 302V390H302A40 40 0 0 1 262 350V302A40 40 0 0 1 302 262Z',
			fill: 'var(--brand-blue)'
		}
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
	<rect width="512" height="512" rx="96" fill="var(--canvas)" />
	<rect
		x="18"
		y="18"
		width="476"
		height="476"
		rx="80"
		fill="none"
		stroke="var(--chrome)"
		stroke-width="8"
	/>
	<g transform="translate(5 5)">
		{#each BLOCKS as block, index (block.d)}
			<path class="block" style:--i={index} d={block.d} fill={block.fill} />
		{/each}
	</g>
</svg>

<style>
	.logo {
		display: block;
		border-radius: 19%;
		flex: none;
		background: var(--canvas);
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
