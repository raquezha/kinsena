<script lang="ts">
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import { DESTINATION_KIND_LABELS } from '../../domain/destination.ts';
	import type { Destination } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';

	let { destination }: { destination: Destination } = $props();
	const sheet = $derived(`place-${destination.id}`);
</script>

<a
	class="row"
	href={sheetHref(sheet)}
	data-sveltekit-noscroll
	onclick={(event) => {
		event.preventDefault();
		void openSheet(sheet);
	}}
>
	<span class="titles">
		<span class="name">{destination.name}</span>
		<span class="meta">{DESTINATION_KIND_LABELS[destination.kind]}</span>
	</span>
	<span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
</a>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 64px;
		padding: 0 var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		background: var(--surface);
		color: inherit;
		text-decoration: none;
	}

	.titles {
		flex: 1;
		display: grid;
		gap: 2px;
	}

	.name {
		font-weight: 700;
	}

	.meta {
		color: var(--text-dim);
		font-size: var(--text-sm);
	}

	.chevron {
		color: var(--text-dim);
	}
</style>
