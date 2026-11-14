<script lang="ts">
	import { Checklist as ChecklistState } from '../../client/checklist.svelte.ts';
	import { currentSheet } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { CycleView } from '../../domain/summary.ts';
	import AddFab from './AddFab.svelte';
	import AddItemSheet from './AddItemSheet.svelte';
	import Checklist from './Checklist.svelte';
	import CycleHeader from './CycleHeader.svelte';
	import CycleSheet from './CycleSheet.svelte';
	import ItemSheet from './ItemSheet.svelte';
	import SummaryCard from './SummaryCard.svelte';

	let { view, currency }: { view: CycleView; currency: CurrencyCode } = $props();

	const checklist = new ChecklistState({
		items: () => view.items,
		salary: () => view.cycle.salary
	});

	const sheet = $derived(currentSheet());
	const editing = $derived(
		sheet?.startsWith('item-')
			? checklist.items.find((item) => `item-${item.id}` === sheet)
			: undefined
	);
</script>

<div class="active">
	<div class="header"><CycleHeader cycle={view.cycle} /></div>
	<div class="summary">
		<SummaryCard cycle={view.cycle} summary={checklist.summary} {currency} />
	</div>
	<div class="list"><Checklist {checklist} {currency} /></div>
</div>

<AddFab />
<AddItemSheet open={sheet === 'add'} cycleId={view.cycle.id} />
<CycleSheet open={sheet === 'cycle'} cycle={view.cycle} itemCount={checklist.items.length} />
<ItemSheet item={editing} {checklist} {currency} />

<style>
	.active {
		display: grid;
		gap: var(--space-5);
		grid-template-areas: 'header' 'summary' 'list';
	}

	.header {
		grid-area: header;
	}

	.summary {
		grid-area: summary;
	}

	.list {
		grid-area: list;
	}

	@media (min-width: 1100px) {
		.active {
			grid-template-columns: minmax(0, 1fr) 380px;
			grid-template-areas: 'header header' 'list summary';
			gap: var(--space-6) var(--space-8);
			align-items: start;
		}

		.summary {
			position: sticky;
			top: var(--space-8);
		}
	}
</style>
