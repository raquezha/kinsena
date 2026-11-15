<script lang="ts">
	import { Checklist as ChecklistState } from '../../client/checklist.svelte.ts';
	import { currentSheet } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Destination, TemplateItem } from '../../domain/models.ts';
	import type { PaydayView } from '../../domain/summary.ts';
	import PaydaySwitcher from '../payday/PaydaySwitcher.svelte';
	import AddFab from './AddFab.svelte';
	import AddItemSheet from './AddItemSheet.svelte';
	import Checklist from './Checklist.svelte';
	import CustomAmountSheet from './CustomAmountSheet.svelte';
	import CycleHeader from './CycleHeader.svelte';
	import CycleSheet from './CycleSheet.svelte';
	import ItemSheet from './ItemSheet.svelte';
	import FinishCheckSheet from './FinishCheckSheet.svelte';
	import OtherPaydaySheet from './OtherPaydaySheet.svelte';
	import PlanSheet from './PlanSheet.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import ReceiveSheet from './ReceiveSheet.svelte';
	import SkipSheet from './SkipSheet.svelte';
	import SummaryCard from './SummaryCard.svelte';

	let {
		view,
		currency,
		destinations,
		templates,
		paydays,
		nextScheduledDate,
		plan,
		finishIssues
	}: {
		view: PaydayView;
		currency: CurrencyCode;
		destinations: Destination[];
		templates: TemplateItem[];
		paydays: import('../../domain/models.ts').Payday[];
		nextScheduledDate: string | null;
		plan: import('../../domain/planner.ts').PlanProposal | null;
		finishIssues: import('../../domain/finish.ts').FinishIssue[];
	} = $props();

	const checklist = new ChecklistState({
		items: () => view.items,
		payday: () => view.payday
	});

	const sheet = $derived(currentSheet());
	const editing = $derived(
		sheet?.startsWith('item-')
			? checklist.items.find((item) => `item-${item.id}` === sheet)
			: undefined
	);
	const skipping = $derived(
		sheet?.startsWith('skip-')
			? checklist.items.find((item) => `skip-${item.id}` === sheet)
			: undefined
	);
	const custom = $derived(
		sheet?.startsWith('custom-')
			? checklist.items.find((item) => `custom-${item.id}` === sheet)
			: undefined
	);
</script>

<PaydaySwitcher {paydays} activeId={view.payday.id} />

<div class="active">
	<div class="header"><CycleHeader payday={view.payday} arrivalNote={view.arrivalNote} /></div>
	<div class="summary">
		<SummaryCard payday={view.payday} summary={checklist.summary} {currency} />
	</div>
	<div class="list">
		{#if checklist.routing}
			<ProgressBar summary={checklist.summary} {currency} />
		{/if}
		<Checklist {checklist} paydayId={view.payday.id} {currency} {destinations} {templates} />
	</div>
</div>

<AddFab />
<AddItemSheet open={sheet === 'add'} paydayId={view.payday.id} {destinations} />
<ReceiveSheet open={sheet === 'receive'} payday={view.payday} {currency} />
<CycleSheet
	open={sheet === 'cycle'}
	payday={view.payday}
	unpaidCount={checklist.unpaid.length}
	missingCount={checklist.summary.missingCount}
	issuesCount={finishIssues.length}
/>
<PlanSheet open={sheet === 'plan'} paydayId={view.payday.id} {plan} {currency} />
<FinishCheckSheet open={sheet === 'finish-check'} paydayId={view.payday.id} issues={finishIssues} />
<ItemSheet item={editing} {destinations} ondelete={(item) => checklist.remove(item)} />
<OtherPaydaySheet open={sheet === 'other'} />
<SkipSheet item={skipping} {nextScheduledDate} />
<CustomAmountSheet item={custom} />

<style>
	.active {
		display: grid;
		gap: var(--space-8);
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
