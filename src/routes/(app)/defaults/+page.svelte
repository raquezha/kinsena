<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import { currentSheet, openSheet, sheetHref } from '#lib/client/sheet-route.ts';
	import AddTemplateSheet from '#lib/ui/defaults/AddTemplateSheet.svelte';
	import TemplateRow from '#lib/ui/defaults/TemplateRow.svelte';
	import TemplateSheet from '#lib/ui/defaults/TemplateSheet.svelte';
	import AddDestinationSheet from '#lib/ui/defaults/AddDestinationSheet.svelte';
	import DestinationRow from '#lib/ui/defaults/DestinationRow.svelte';
	import DestinationSheet from '#lib/ui/defaults/DestinationSheet.svelte';
	import Icon from '#lib/ui/icons/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sheet = $derived(currentSheet());
	const editing = $derived(data.templates.find((template) => `saved-${template.id}` === sheet));
	const editingDestination = $derived(
		data.destinations.find((destination) => `place-${destination.id}` === sheet)
	);
	const usageCountByDestinationId = $derived.by(() => {
		const counts: Record<number, number> = {};
		for (const template of data.templates) {
			if (template.destinationId === null) continue;
			counts[template.destinationId] = (counts[template.destinationId] ?? 0) + 1;
		}
		return counts;
	});

	function openNewItem(event: MouseEvent) {
		event.preventDefault();
		void openSheet('new');
	}

	function openNewDestination(event: MouseEvent) {
		event.preventDefault();
		void openSheet('place');
	}
</script>

<svelte:head>
	<title>Kinsena · Defaults</title>
</svelte:head>

<header class="defaults-header">
	<div class="actions">
		<a
			class="button destination"
			href={sheetHref('place')}
			data-sveltekit-noscroll
			onclick={openNewDestination}
			aria-label="Add destination"
			title="Add destination"
		>
			<Icon name="plus" size={18} />
			<span class="destination-label">Add destination</span>
		</a>
		<a
			class="button primary add-item"
			href={sheetHref('new')}
			data-sveltekit-noscroll
			onclick={openNewItem}
		>
			<Icon name="plus" size={18} /> <span class="label">Add item</span>
		</a>
	</div>
	<div class="copy">
		<h1>Defaults</h1>
		<p class="desc long">
			Starting templates for upcoming paydays — adjust amounts or schedules anytime inside each
			cycle.
		</p>
		<p class="desc short">Starting templates for upcoming paydays.</p>
	</div>
</header>

<section class="block">
	<h2>Recurring items</h2>
	{#if data.templates.length === 0}
		<p class="empty" in:fade>
			Nothing saved yet. Add rent, a card statement, or a savings transfer.
		</p>
	{/if}
	<ul class="saved templates">
		{#each data.templates as template, index (template.id)}
			<li
				animate:flip={{ duration: 260 }}
				in:fly={{ y: 10, delay: Math.min(index, 8) * 30 }}
				out:fade={{ duration: 160 }}
			>
				<TemplateRow {template} currency={data.currency} destinations={data.destinations} />
			</li>
		{/each}
		<li class="add-slot-item">
			<a class="add-slot" href={sheetHref('new')} data-sveltekit-noscroll onclick={openNewItem}>
				<Icon name="plus" size={18} />
				<span>Add recurring item</span>
			</a>
		</li>
	</ul>
</section>

<section class="block">
	<h2>Accounts and billers</h2>
	{#if data.destinations.length === 0}
		<p class="empty" in:fade>Add a bank account or biller so you can route salary to it.</p>
	{:else}
		<ul class="saved places">
			{#each data.destinations as destination (destination.id)}
				<li>
					<DestinationRow
						{destination}
						brandIcon={destination.brandIcon}
						usageCount={usageCountByDestinationId[destination.id] ?? 0}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<AddTemplateSheet open={sheet === 'new'} destinations={data.destinations} />
<TemplateSheet template={editing} destinations={data.destinations} />
<AddDestinationSheet open={sheet === 'place'} />
<DestinationSheet destination={editingDestination} />

<style>
	.defaults-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-8);
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.destination {
		width: var(--tap);
		min-width: var(--tap);
		padding-inline: 0;
		justify-content: center;
	}

	.destination-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.copy h1 {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.desc {
		margin-top: var(--space-1);
		color: var(--text-muted);
		max-width: 60ch;
	}

	.desc.long {
		display: none;
	}

	.block {
		margin-bottom: var(--space-8);
	}

	h2 {
		margin-bottom: var(--space-3);
		font-size: 1.45rem;
	}

	.saved {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.empty {
		margin-bottom: var(--space-3);
		padding: var(--space-6);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		text-align: center;
	}

	.add-slot-item {
		display: flex;
	}

	.add-slot {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		height: 100%;
		min-height: 3.25rem;
		padding: 0.875rem 1rem;
		border: 1px dashed rgb(255 255 255 / 0.12);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-muted);
		text-decoration: none;
		cursor: pointer;
		transition:
			border-color var(--duration-fast) var(--ease-out),
			background-color var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-out);
	}

	.add-slot:hover,
	.add-slot:focus-visible {
		border-color: rgb(255 255 255 / 0.24);
		background: rgb(255 255 255 / 0.01);
		color: var(--text);
		outline: none;
	}

	@media (min-width: 640px) {
		.defaults-header {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
			gap: var(--space-4);
		}

		.actions {
			order: 2;
			flex: none;
			flex-direction: column-reverse;
			align-items: stretch;
			justify-content: flex-start;
			gap: 0.5rem;
		}

		.copy {
			order: 1;
			min-width: 0;
		}

		.destination {
			width: auto;
			min-width: 0;
			padding-inline: var(--space-4);
		}

		.destination-label {
			position: static;
			width: auto;
			height: auto;
			margin: 0;
			clip: auto;
			overflow: visible;
			white-space: nowrap;
		}

		.destination :global(svg) {
			display: none;
		}

		.desc.short {
			display: none;
		}

		.desc.long {
			display: block;
		}

		.saved {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.875rem;
		}

		.add-slot {
			min-height: 6.75rem;
		}
	}

	@media (min-width: 1024px) {
		.actions {
			flex-direction: row;
			align-items: center;
		}

		.saved.templates {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1rem;
		}

		.saved.places {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1rem;
		}
	}
</style>
