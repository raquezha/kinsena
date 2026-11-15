<script lang="ts">
	import { paydayHref } from '../../client/sheet-route.ts';
	import { isReceived, type Payday } from '../../domain/models.ts';

	let {
		paydays,
		activeId
	}: {
		paydays: Payday[];
		activeId: number | null;
	} = $props();
</script>

{#if paydays.length > 1}
	<nav class="switcher" aria-label="Paydays">
		{#each paydays as payday (payday.id)}
			<a
				class="chip"
				class:current={payday.id === activeId}
				href={paydayHref(payday.id)}
				aria-current={payday.id === activeId ? 'page' : undefined}
			>
				<span class="title">{payday.title}</span>
				<span class="meta">{isReceived(payday) ? 'Received' : 'Upcoming'}</span>
			</a>
		{/each}
	</nav>
{/if}

<style>
	.switcher {
		display: flex;
		gap: var(--space-2);
		overflow-x: auto;
		padding-bottom: var(--space-1);
		margin-bottom: var(--space-4);
		scrollbar-width: none;
	}

	.chip {
		flex: none;
		display: grid;
		gap: 1px;
		min-width: 7.5rem;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--surface);
		color: inherit;
		text-decoration: none;
	}

	.chip.current {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.title {
		font-weight: 700;
	}

	.meta {
		color: var(--text-dim);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.chip.current .meta {
		color: var(--accent);
	}

	@media (min-width: 640px) {
		.switcher {
			display: none;
		}
	}
</style>
