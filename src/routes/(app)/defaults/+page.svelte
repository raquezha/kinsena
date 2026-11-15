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
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sheet = $derived(currentSheet());
	const editing = $derived(data.templates.find((template) => `saved-${template.id}` === sheet));
	const editingDestination = $derived(
		data.destinations.find((destination) => `place-${destination.id}` === sheet)
	);
</script>

<svelte:head>
	<title>Kinsena · Defaults</title>
</svelte:head>

<PageHeader
	title="Defaults"
	description="Recurring bills and the accounts or billers salary can go to."
>
	{#snippet actions()}
		<a
			class="button"
			href={sheetHref('place')}
			data-sveltekit-noscroll
			onclick={(event) => {
				event.preventDefault();
				void openSheet('place');
			}}
		>
			Add destination
		</a>
		<a
			class="button primary"
			href={sheetHref('new')}
			data-sveltekit-noscroll
			onclick={(event) => {
				event.preventDefault();
				void openSheet('new');
			}}
		>
			<Icon name="plus" size={18} /> <span class="label">Add item</span>
		</a>
	{/snippet}
</PageHeader>

<section class="block">
	<h2>Recurring items</h2>
	{#if data.templates.length === 0}
		<p class="empty" in:fade>
			Nothing saved yet. Add rent, a card statement, or a savings transfer.
		</p>
	{:else}
		<ul class="saved">
			{#each data.templates as template, index (template.id)}
				<li
					animate:flip={{ duration: 260 }}
					in:fly={{ y: 10, delay: Math.min(index, 8) * 30 }}
					out:fade={{ duration: 160 }}
				>
					<TemplateRow {template} currency={data.currency} destinations={data.destinations} />
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="block">
	<h2>Accounts and billers</h2>
	{#if data.destinations.length === 0}
		<p class="empty" in:fade>Add a bank account or biller so you can route salary to it.</p>
	{:else}
		<ul class="saved">
			{#each data.destinations as destination (destination.id)}
				<li>
					<DestinationRow {destination} />
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
	.block {
		margin-bottom: var(--space-8);
	}

	h2 {
		margin-bottom: var(--space-3);
		font-size: var(--text-lg);
		font-size: 1.45rem;
	}

	.saved {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}

	.empty {
		padding: var(--space-6);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		text-align: center;
	}

	@media (min-width: 640px) {
		.saved {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.saved {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
