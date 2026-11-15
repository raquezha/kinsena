<script lang="ts">
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import { isReceived, type Payday } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';

	let { payday, arrivalNote = null }: { payday: Payday; arrivalNote?: string | null } = $props();

	const received = $derived(isReceived(payday));

	function open(name: string) {
		return (event: MouseEvent) => {
			event.preventDefault();
			void openSheet(name);
		};
	}
</script>

<header class="cycle-header" class:has-receive={!received}>
	<div class="titles">
		<p class="date">{received ? 'Received' : 'Upcoming'}</p>
		<h1>{payday.title}</h1>
		{#if arrivalNote}
			<p class="arrival">{arrivalNote}</p>
		{/if}
		{#if payday.note}
			<p class="note"><Icon name="note" size={14} /> {payday.note}</p>
		{/if}
	</div>
	<div class="actions">
		{#if !received}
			<a
				class="button primary receive"
				href={sheetHref('receive')}
				onclick={open('receive')}
				data-sveltekit-noscroll
			>
				Salary in <kbd class="kbd">i</kbd>
			</a>
		{/if}
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
			<Icon name="salary" size={20} />
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
		gap: var(--space-1);
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

	.arrival,
	.note {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-top: var(--space-1);
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.arrival {
		color: var(--notice);
		line-height: 1.45;
		max-width: 42ch;
	}

	.actions {
		display: flex;
		flex: none;
		gap: var(--space-2);
	}

	.receive {
		white-space: nowrap;
	}

	/* The shortcut badge sits on the gold primary fill; keep it on accent-ink like the label. */
	.receive .kbd {
		color: var(--accent-ink);
		border-color: rgb(26 22 14 / 0.35);
	}

	.icon-only {
		width: var(--tap);
		padding: 0;
	}

	.add {
		display: none;
	}

	.receive .kbd,
	.add .kbd {
		display: none;
	}

	@media (max-width: 639.98px) {
		.cycle-header.has-receive {
			flex-direction: column;
			align-items: stretch;
		}

		.has-receive .actions {
			justify-content: flex-end;
		}
	}

	@media (min-width: 640px) {
		.add {
			display: inline-flex;
		}

		h1 {
			font-size: 1.75rem;
		}
	}

	@media (min-width: 1100px) {
		.add .kbd,
		.receive .kbd {
			display: inline;
		}
	}
</style>
