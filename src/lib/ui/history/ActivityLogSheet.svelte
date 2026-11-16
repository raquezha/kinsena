<script lang="ts">
	import type { ActivityEvent } from '../../domain/activity.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let {
		open,
		events,
		onclose
	}: {
		open: boolean;
		events: ActivityEvent[];
		onclose: () => void;
	} = $props();

	function formatWhen(ms: number): string {
		return new Date(ms).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<Sheet
	{open}
	title="Activity log"
	description="Audit trail for payday actions."
	closeHref="/history"
	{onclose}
>
	{#if events.length === 0}
		<p class="empty">No activity yet.</p>
	{:else}
		<ol class="activity-list">
			{#each events as event (event.id)}
				<li>
					<p class="summary">{event.summary}</p>
					<time datetime={new Date(event.createdAt).toISOString()}
						>{formatWhen(event.createdAt)}</time
					>
				</li>
			{/each}
		</ol>
	{/if}
</Sheet>

<style>
	.empty {
		margin: 0;
		color: var(--text-muted);
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

	.summary {
		margin: 0;
		min-width: 0;
		flex: 1 1 12rem;
		overflow-wrap: anywhere;
	}

	time {
		flex-shrink: 0;
		color: var(--text-muted);
		font-size: var(--text-sm);
	}
</style>
