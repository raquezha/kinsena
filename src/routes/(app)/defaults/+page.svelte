<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import { currentSheet, openSheet, sheetHref } from '#lib/client/sheet-route.ts';
	import AddTemplateSheet from '#lib/ui/defaults/AddTemplateSheet.svelte';
	import TemplateRow from '#lib/ui/defaults/TemplateRow.svelte';
	import TemplateSheet from '#lib/ui/defaults/TemplateSheet.svelte';
	import Icon from '#lib/ui/icons/Icon.svelte';
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sheet = $derived(currentSheet());
	const editing = $derived(data.templates.find((template) => `saved-${template.id}` === sheet));
</script>

<svelte:head>
	<title>Kinsena · Defaults</title>
</svelte:head>

<PageHeader
	title="Defaults"
	description="Recurring items copied into each new cycle. Leave the amount blank when it varies."
>
	{#snippet actions()}
		<a
			class="button primary"
			href={sheetHref('new')}
			data-sveltekit-noscroll
			onclick={(event) => {
				event.preventDefault();
				void openSheet('new');
			}}
		>
			<Icon name="plus" size={18} /> <span class="label">Add</span>
		</a>
	{/snippet}
</PageHeader>

{#if data.templates.length === 0}
	<p class="empty" in:fade>
		Nothing saved yet. Add rent, internet, savings — anything you pay every payday.
	</p>
{:else}
	<ul class="saved">
		{#each data.templates as template, index (template.id)}
			<li
				animate:flip={{ duration: 260 }}
				in:fly={{ y: 10, delay: Math.min(index, 8) * 30 }}
				out:fade={{ duration: 160 }}
			>
				<TemplateRow {template} currency={data.currency} />
			</li>
		{/each}
	</ul>
{/if}

<AddTemplateSheet open={sheet === 'new'} />
<TemplateSheet template={editing} />

<style>
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
