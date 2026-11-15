<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import HistoryCard from '#lib/ui/history/HistoryCard.svelte';
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Kinsena · History</title>
</svelte:head>

<PageHeader
	title="History"
	description="Finished paydays are read-only. Reopen the latest one if you finished it by mistake."
/>

{#if data.paydays.length === 0}
	<p class="empty">When you finish a payday it will live here.</p>
{:else}
	<ol class="history">
		{#each data.paydays as view, index (view.payday.id)}
			<li animate:flip={{ duration: 260 }} in:fly={{ y: 12, delay: Math.min(index, 8) * 40 }}>
				<HistoryCard
					{view}
					currency={data.currency}
					reopenable={view.payday.id === data.reopenableId}
				/>
			</li>
		{/each}
	</ol>
{/if}

<style>
	.empty {
		color: var(--text-muted);
	}

	.history {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-3);
	}

	@media (min-width: 1100px) {
		.history {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			align-items: start;
		}
	}
</style>
