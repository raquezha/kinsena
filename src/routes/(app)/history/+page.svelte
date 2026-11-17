<script lang="ts">
	import { flip } from 'svelte/animate';
	import { yearFromIsoDate } from '#lib/domain/history-archive.ts';
	import ActivityLogSheet from '#lib/ui/history/ActivityLogSheet.svelte';
	import HistoryCard from '#lib/ui/history/HistoryCard.svelte';
	import StatementLedger from '#lib/ui/history/StatementLedger.svelte';
	import Icon from '#lib/ui/icons/Icon.svelte';
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import Sheet from '#lib/ui/overlay/Sheet.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let selectedId = $state<number | null>(null);
	let activityOpen = $state(false);
	let ledgerOpen = $state(false);

	const years = $derived.by(() => {
		const groups: { year: string; paydays: typeof data.paydays }[] = [];
		for (const view of data.paydays) {
			const year = yearFromIsoDate(view.payday.scheduledDate);
			const existing = groups.find((group) => group.year === year);
			if (existing) existing.paydays.push(view);
			else groups.push({ year, paydays: [view] });
		}
		return groups;
	});

	const selected = $derived(data.paydays.find((view) => view.payday.id === selectedId) ?? null);

	function selectPayday(id: number) {
		selectedId = id;
		ledgerOpen = true;
	}

	function closeLedger() {
		ledgerOpen = false;
	}
</script>

<svelte:head>
	<title>Kinsena · History</title>
</svelte:head>

<PageHeader title="History" description="Completed payday cycles and disbursement summaries.">
	{#snippet actions()}
		<button
			class="activity-btn"
			type="button"
			aria-label="Activity log"
			onclick={() => (activityOpen = true)}
		>
			<Icon name="checklist" size={14} />
			<span>Activity log</span>
		</button>
	{/snippet}
</PageHeader>

{#if data.paydays.length === 0}
	<p class="empty">When you finish a payday it will live here.</p>
{:else}
	<div class="archive">
		{#each years as group (group.year)}
			<section class="year" aria-labelledby={`year-${group.year}`}>
				<h2 id={`year-${group.year}`} class="year-heading">{group.year}</h2>
				<ol class="cards">
					{#each group.paydays as view (view.payday.id)}
						<li animate:flip={{ duration: 260 }}>
							<HistoryCard
								{view}
								currency={data.currency}
								destinations={data.destinations}
								selected={ledgerOpen && selected?.payday.id === view.payday.id}
								latest={view.payday.id === data.reopenableId}
								onclick={() => selectPayday(view.payday.id)}
							/>
						</li>
					{/each}
				</ol>
			</section>
		{/each}
	</div>
{/if}

{#if selected}
	<Sheet
		open={ledgerOpen}
		title={selected.payday.title}
		description="Read-only disbursement statement."
		closeHref="/history"
		onclose={closeLedger}
	>
		<StatementLedger
			view={selected}
			currency={data.currency}
			destinations={data.destinations}
			reopenable={selected.payday.id === data.reopenableId}
		/>
	</Sheet>
{/if}

<ActivityLogSheet
	open={activityOpen}
	events={data.activity}
	onclose={() => (activityOpen = false)}
/>

<style>
	.activity-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid rgb(255 255 255 / 0.1);
		background: rgb(255 255 255 / 0.04);
		color: rgb(255 255 255 / 0.8);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.activity-btn:hover {
		background: rgb(255 255 255 / 0.08);
	}

	.empty {
		color: var(--text-muted);
	}

	.archive {
		display: grid;
		gap: 1.5rem;
		max-width: 42rem;
	}

	.year-heading {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		font-weight: 650;
		color: rgb(255 255 255 / 0.4);
	}

	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.875rem;
	}
</style>
