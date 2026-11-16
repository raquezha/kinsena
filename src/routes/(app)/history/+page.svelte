<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import HistoryCard from '#lib/ui/history/HistoryCard.svelte';
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatWhen(ms: number): string {
		return new Date(ms).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Kinsena · History</title>
</svelte:head>

<PageHeader
	title="History"
	description="Finished paydays are read-only. Reopen the latest one if you finished it by mistake."
/>

{#if data.activity.length > 0}
	<section class="activity" aria-labelledby="activity-heading">
		<h2 id="activity-heading">Activity</h2>
		<ol class="activity-list">
			{#each data.activity as event (event.id)}
				<li>
					<p class="summary">{event.summary}</p>
					<time datetime={new Date(event.createdAt).toISOString()}>{formatWhen(event.createdAt)}</time>
				</li>
			{/each}
		</ol>
	</section>
{/if}

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

	.activity {
		margin-bottom: var(--space-5);
	}

	.activity h2 {
		margin: 0 0 var(--space-2);
		font-size: var(--text-lg);
		font-weight: 600;
	}

	.activity-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}

	.activity-list li {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-1) var(--space-3);
		align-items: baseline;
	}

	.activity-list .summary {
		margin: 0;
		min-width: 0;
		flex: 1 1 12rem;
		overflow-wrap: anywhere;
	}

	.activity-list time {
		flex-shrink: 0;
		color: var(--text-muted);
		font-size: var(--text-sm);
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
