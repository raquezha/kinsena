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
		<span class="placard">{destination.name}</span>
	{/if}
	{#if dueDate}
		<span>Due {formatShortDate(dueDate)}</span>
	{/if}
	{#if isDone}
		<span class="bayad">Bayad na</span>
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

	.placard {
		display: inline-block;
		padding: 0 6px 1px;
		border: 1px solid var(--chrome);
		background: var(--surface-sunken);
		color: var(--text);
		font-family: var(--font-display);
		font-size: 0.8rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		font-weight: 400;
	}

	.bayad {
		color: var(--brand-green);
		font-family: var(--font-display);
		font-size: 0.85rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		animation: bayad-in 420ms var(--ease-spring);
	}

	@keyframes bayad-in {
		0% {
			transform: scale(0.6) rotate(-6deg);
			opacity: 0;
		}
		70% {
			transform: scale(1.12) rotate(2deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bayad {
			animation: none;
		}
	}
</style>
