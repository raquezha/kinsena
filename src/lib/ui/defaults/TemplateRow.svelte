<script lang="ts">
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import { CADENCE_LABELS } from '../../domain/cadence.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { TemplateItem } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import Icon from '../icons/Icon.svelte';

	let { template, currency }: { template: TemplateItem; currency: CurrencyCode } = $props();
	const sheet = $derived(`saved-${template.id}`);
</script>

<a
	class="saved-row"
	href={sheetHref(sheet)}
	data-sveltekit-noscroll
	onclick={(event) => {
		event.preventDefault();
		void openSheet(sheet);
	}}
>
	<span class="titles">
		<span class="name">{template.name}</span>
		<span class="cadence">{CADENCE_LABELS[template.cadence]}</span>
	</span>
	<span class="amount tabular" class:varies={template.defaultAmount === null}>
		{template.defaultAmount === null ? 'Varies' : formatMoney(template.defaultAmount, currency)}
	</span>
	<span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
</a>

<style>
	.saved-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 64px;
		padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		background: var(--surface);
		color: inherit;
		text-decoration: none;
		transition:
			background var(--duration-base),
			border-color var(--duration-base);
	}

	.titles {
		flex: 1;
		min-width: 0;
		display: grid;
	}

	.name {
		font-weight: 650;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cadence {
		color: var(--text-dim);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.amount {
		font-weight: 700;
	}

	.varies {
		color: var(--text-dim);
		font-weight: 600;
	}

	.chevron {
		display: grid;
		color: var(--text-dim);
	}

	@media (hover: hover) {
		.saved-row:hover {
			background: var(--surface-hover);
			border-color: var(--border);
		}
	}
</style>
