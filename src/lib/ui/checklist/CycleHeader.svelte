<script lang="ts">
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import type { Cycle } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';
	import { formatCycleDate } from './dates.ts';

	let { cycle }: { cycle: Cycle } = $props();

	function open(name: string) {
		return (event: MouseEvent) => {
			event.preventDefault();
			void openSheet(name);
		};
	}
</script>

<header class="cycle-header">
	<div class="titles">
		<p class="date">Started {formatCycleDate(cycle.date)}</p>
		<h1>{cycle.title}</h1>
		{#if cycle.note}
			<p class="note"><Icon name="note" size={14} /> {cycle.note}</p>
		{/if}
	</div>
	<div class="actions">
		<a class="button add" href={sheetHref('add')} onclick={open('add')} data-sveltekit-noscroll>
			<Icon name="plus" size={18} /> Add item <kbd class="kbd">n</kbd>
		</a>
		<a
			class="button icon-only"
			href={sheetHref('cycle')}
			onclick={open('cycle')}
			aria-label="Salary, note and finish"
			title="Salary, note and finish (c)"
			data-sveltekit-noscroll
		>
			<Icon name="wallet" size={20} />
		</a>
	</div>
</header>

<style>
	.cycle-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.titles {
		min-width: 0;
		display: grid;
		gap: 2px;
	}

	.date {
		color: var(--text-dim);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	h1 {
		font-size: var(--text-xl);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.note {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-top: var(--space-1);
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}

	.icon-only {
		width: var(--tap);
		padding: 0;
	}

	.add {
		display: none;
	}

	@media (min-width: 640px) {
		.add {
			display: inline-flex;
		}

		h1 {
			font-size: 1.75rem;
		}
	}

	.add .kbd {
		display: none;
	}

	@media (min-width: 1100px) {
		.add .kbd {
			display: inline;
		}
	}
</style>
