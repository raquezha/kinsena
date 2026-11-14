<script lang="ts">
	/** The Kinsena mark: a mint coin with a check, on a deep green tile. */
	let { size = 40, animate = false }: { size?: number; animate?: boolean } = $props();
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
		<linearGradient id="logo-bg" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#16251c" />
			<stop offset="1" stop-color="#0a120d" />
		</linearGradient>
		<linearGradient id="logo-coin" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#d6eedf" />
			<stop offset="1" stop-color="#9ccbac" />
		</linearGradient>
	</defs>
	<rect width="512" height="512" rx="116" fill="url(#logo-bg)" />
	<circle class="coin" cx="256" cy="256" r="164" fill="url(#logo-coin)" />
	<circle
		cx="256"
		cy="256"
		r="134"
		fill="none"
		stroke="#0c1610"
		stroke-opacity="0.22"
		stroke-width="12"
	/>
	<path
		class="tick"
		d="M176 262 L232 318 L340 200"
		fill="none"
		stroke="#0c1610"
		stroke-width="46"
		stroke-linecap="round"
		stroke-linejoin="round"
		pathLength="1"
	/>
</svg>

<style>
	.logo {
		display: block;
		border-radius: 23%;
		flex: none;
	}

	.animate .coin {
		transform-origin: 256px 256px;
		animation: coin-in 600ms var(--ease-spring) both;
	}

	.animate .tick {
		stroke-dasharray: 1;
		animation: draw 520ms 260ms var(--ease-out) both;
	}

	@keyframes coin-in {
		from {
			transform: scale(0.4) rotate(-40deg);
			opacity: 0;
		}
	}

	@keyframes draw {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animate .coin,
		.animate .tick {
			animation: none;
		}
	}
</style>
