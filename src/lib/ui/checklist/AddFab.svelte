<script lang="ts">
	import { scale } from 'svelte/transition';
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import Icon from '../icons/Icon.svelte';
</script>

<a
	class="fab"
	href={sheetHref('add')}
	aria-label="Add an item"
	data-sveltekit-noscroll
	in:scale={{ start: 0.6, duration: 320 }}
	onclick={(event) => {
		event.preventDefault();
		void openSheet('add');
	}}
>
	<Icon name="plus" size={26} stroke={2.4} />
</a>

<style>
	.fab {
		position: fixed;
		z-index: var(--z-fab);
		right: var(--space-5);
		bottom: calc(var(--nav-height) + var(--safe-bottom) + var(--space-4));
		display: grid;
		place-items: center;
		width: 60px;
		height: 60px;
		border-radius: 20px;
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow:
			0 10px 28px rgb(224 196 138 / 0.22),
			0 4px 12px rgb(0 0 0 / 0.5);
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.fab:active {
		transform: scale(0.92);
	}

	@media (min-width: 640px) {
		.fab {
			display: none;
		}
	}
</style>
