<script lang="ts">
	import type { Destination } from '../../domain/models.ts';
	import { formatShortDate } from './dates.ts';

	let {
		destination,
		dueDate,
		isDone,
		installment = null,
		reason = null
	}: {
		destination: Destination | null;
		dueDate: string | null;
		isDone: boolean;
		installment?: string | null;
		reason?: string | null;
	} = $props();
</script>

<span class="meta">
	{#if destination}
		<span>{destination.name}</span>
	{/if}
	{#if dueDate}
		<span>Due {formatShortDate(dueDate)}</span>
	{/if}
	{#if installment}
		<span>{installment}</span>
	{/if}
	{#if isDone}
		<span class="paid-label">Paid</span>
	{/if}
	{#if reason}
		<span class="reason">{reason}</span>
	{/if}
	{#if !destination && !dueDate && !installment && !isDone && !reason}&nbsp;{/if}
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

	.reason {
		flex: 1 1 100%;
		color: var(--text-dim);
		font-weight: 500;
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
