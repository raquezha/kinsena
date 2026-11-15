<script lang="ts">
	import type { Destination } from '../../domain/models.ts';
	import { formatShortDate } from './dates.ts';

	let {
		destination,
		dueDate,
		isDone
	}: {
		destination: Destination | null;
		dueDate: string | null;
		isDone: boolean;
	} = $props();
</script>

<span class="meta">
	{#if destination}
		<span>{destination.name}</span>
	{/if}
	{#if dueDate}
		<span>Due {formatShortDate(dueDate)}</span>
	{/if}
	{#if isDone}
		<span class="paid-label">Paid</span>
	{/if}
	{#if !destination && !dueDate && !isDone}&nbsp;{/if}
</span>

<style>
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) var(--space-2);
		color: var(--text-dim);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.paid-label {
		color: var(--accent);
		animation: paid-in 420ms var(--ease-spring);
	}

	@keyframes paid-in {
		from {
			transform: scale(0.85);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.paid-label {
			animation: none;
		}
	}
</style>
