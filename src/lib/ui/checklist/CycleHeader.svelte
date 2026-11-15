<script lang="ts">
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import { formatRouteSign } from '../../domain/calendar.ts';
	import { isReceived, type Payday } from '../../domain/models.ts';
	import Motif from '../brand/Motif.svelte';
	import Icon from '../icons/Icon.svelte';

	let { payday }: { payday: Payday } = $props();

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
		<h1>
			<span class="sign">{formatRouteSign(payday.scheduledDate)}</span>
			<span class="arrow" aria-hidden="true">→</span>
			<span class="dest">{received ? 'Bayad' : 'Bills'}</span>
			<span class="star" aria-hidden="true"><Motif kind="star" size={14} /></span>
		</h1>
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
		gap: 6px;
	}

	.date {
		color: var(--text-dim);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-2);
		font-size: clamp(2rem, 8vw, 2.75rem);
	}

	.sign,
	.dest {
		padding: 0.08em 0.22em 0;
		line-height: 0.9;
	}

	.sign {
		background: var(--accent);
		color: var(--accent-ink);
	}

	.dest {
		background: var(--brand-red);
		color: var(--brand-red-ink);
	}

	.arrow {
		color: var(--chrome-strong);
		font-size: 0.7em;
	}

	.star {
		color: var(--accent-text);
		align-self: center;
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
		flex: none;
		gap: var(--space-2);
	}

	.receive {
		white-space: nowrap;
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
	}

	@media (min-width: 1100px) {
		.add .kbd,
		.receive .kbd {
			display: inline;
		}
	}
</style>
