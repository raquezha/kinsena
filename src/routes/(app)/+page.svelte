<script lang="ts">
	import ActiveCycle from '#lib/ui/checklist/ActiveCycle.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Kinsena · {data.active?.payday.title ?? 'Active'}</title>
</svelte:head>

{#if data.active}
	{#key data.active.payday.id}
		<ActiveCycle
			view={data.active}
			currency={data.currency}
			destinations={data.destinations}
			paydays={data.openPaydays}
			nextScheduledDate={data.nextScheduledDate}
		/>
	{/key}
{:else}
	<p class="empty">
		No payday to show yet. Refresh the page, or add a one-off payday from Salary, note and finish.
	</p>
{/if}

<style>
	.empty {
		color: var(--text-muted);
		padding: var(--space-8);
		text-align: center;
	}
</style>
