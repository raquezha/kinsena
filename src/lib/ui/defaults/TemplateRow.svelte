<script lang="ts">
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { FUND_FROM_LABELS } from '../../domain/fund-from.ts';
	import type { Destination, TemplateItem } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import Icon from '../icons/Icon.svelte';

	let {
		template,
		currency,
		destinations
	}: {
		template: TemplateItem;
		currency: CurrencyCode;
		destinations: Destination[];
	} = $props();

	const destination = $derived(destinations.find((entry) => entry.id === template.destinationId));
	const sheet = $derived(`saved-${template.id}`);
</script>

<a
	class="row"
	href={sheetHref(sheet)}
	data-sveltekit-noscroll
	onclick={(event) => {
		event.preventDefault();
		void openSheet(sheet);
	}}
>
	<span class="titles">
		<span class="name">{template.name}</span>
		<span class="meta">
			{FUND_FROM_LABELS[template.fundFrom]}
			{#if template.dueDay}
				· Due day {template.dueDay}{/if}
			{#if destination}
				· {destination.name}{/if}
		</span>
	</span>
	<span class="amount tabular">
		{template.defaultAmount === null ? 'Varies' : formatMoney(template.defaultAmount, currency)}
	</span>
	<span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
</a>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 64px;
		padding: 0 var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		background: var(--surface);
		color: inherit;
		text-decoration: none;
	}

	.titles {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: 2px;
	}

	.name {
		font-weight: 700;
	}

	.meta {
		color: var(--text-dim);
		font-size: var(--text-sm);
	}

	.amount {
		font-weight: 700;
	}

	.chevron {
		color: var(--text-dim);
	}
</style>
