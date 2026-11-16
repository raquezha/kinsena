<script lang="ts">
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { crossfade, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { failureMessage, postAction } from '../../client/actions.ts';
	import type { Checklist } from '../../client/checklist.svelte.ts';
	import {
		CHECKLIST_FLIP_MS,
		startVerticalDragLock,
		stopVerticalDragLock,
		styleChecklistDragGhost
	} from '../../client/checklist-dnd.ts';
	import { toasts } from '../../client/toasts.svelte.ts';
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Destination, RouteItem, TemplateItem } from '../../domain/models.ts';
	import ChecklistRow from './ChecklistRow.svelte';
	import DecisionChips from './DecisionChips.svelte';

	let {
		checklist,
		paydayId,
		currency,
		destinations,
		templates
	}: {
		checklist: Checklist;
		paydayId: number;
		currency: CurrencyCode;
		destinations: (Destination & { brandIcon?: ResolvedBrandIcon | null })[];
		templates: TemplateItem[];
	} = $props();

	const flipDurationMs = CHECKLIST_FLIP_MS;
	const duration = () => (prefersReducedMotion.current ? 0 : 340);
	const [send, receive] = crossfade({
		duration,
		easing: cubicOut,
		fallback: (node) => slide(node, { duration: duration() })
	});

	/** Local draft while dragging/saving — avoids $effect sync loops and refresh flicker. */
	let draftOpen = $state<RouteItem[] | null>(null);
	let dragging = $state(false);
	let saving = $state(false);
	let openListEl = $state<HTMLUListElement | null>(null);

	const openItems = $derived(draftOpen ?? checklist.unpaid);
	/** Grip column stays visible whenever there are 2+ opens — never toggled by saving. */
	const showHandles = $derived(openItems.length > 1);
	/**
	 * dragDisabled must not flip on save (library reconfigures and grips flicker).
	 * Saving blocks input via CSS pointer-events instead.
	 */
	const canDrag = $derived(showHandles);

	$effect(() => () => stopVerticalDragLock());

	function destinationFor(id: number | null) {
		return destinations.find((entry) => entry.id === id) ?? null;
	}

	function installmentLabel(templateId: number | null): string | null {
		if (templateId === null) return null;
		const template = templates.find((entry) => entry.id === templateId);
		if (!template || template.installmentCount === null) return null;
		return `${template.installmentsCompleted} of ${template.installmentCount}`;
	}

	function onConsider(event: CustomEvent<DndEvent<RouteItem>>) {
		if (!dragging) startVerticalDragLock();
		dragging = true;
		draftOpen = event.detail.items;
	}

	function clearZoneMinSize() {
		// Library locks min-height while dragging; clear so the list cannot stay expanded.
		if (!openListEl) return;
		openListEl.style.minHeight = '';
		openListEl.style.minWidth = '';
	}

	async function onFinalize(event: CustomEvent<DndEvent<RouteItem>>) {
		stopVerticalDragLock();
		dragging = false;
		clearZoneMinSize();
		const next = event.detail.items;
		const orderedIds = next.map((item) => item.id);
		const unchanged = orderedIds.join(',') === checklist.unpaid.map((item) => item.id).join(',');
		// In-flight save: keep posted draft — never clear it from a stale "unchanged" finalize.
		if (saving) return;
		// Unchanged drop: drop draft.
		if (unchanged) {
			draftOpen = null;
			return;
		}
		draftOpen = next;
		saving = true;
		try {
			const result = await postAction('?/reorder', {
				paydayId,
				orderedIds: JSON.stringify(orderedIds)
			});
			const error = failureMessage(result);
			if (error) {
				draftOpen = null;
				toasts.error(error);
				return;
			}
			// Keep local rank — do not refreshAll (that remounts and flickers).
			checklist.applyOrder(orderedIds);
			draftOpen = null;
		} finally {
			saving = false;
			clearZoneMinSize();
		}
	}
</script>

{#snippet staticSection(title: string, count: string, items: RouteItem[], kind: string)}
	<section class="group" aria-labelledby="{kind}-heading">
		<h2 id="{kind}-heading">{title} <span class="count">{count}</span></h2>
		<ul class="rows">
			{#each items as item (item.id)}
				<li
					class="row-wrap"
					animate:flip={{ duration: duration() }}
					in:receive={{ key: item.id }}
					out:send={{ key: item.id }}
				>
					<ChecklistRow
						{item}
						{currency}
						destination={destinationFor(item.destinationId)}
						installment={installmentLabel(item.templateId)}
						routing={checklist.routing}
						ontoggle={checklist.toggle(item)}
						ondelete={() => checklist.remove(item)}
					/>
					{#if checklist.routing && item.decision !== 'SKIPPED' && !item.isDone}
						<div class="decisions"><DecisionChips {item} /></div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/snippet}

<div class="checklist">
	{#if checklist.items.length === 0}
		<p class="empty" in:fade>
			{#if checklist.routing}
				No bills on this payday. Salary stays unrouted — or add a transfer to an account.
			{:else}
				Add statements and bills you will pay from this payday.
			{/if}
		</p>
	{/if}
	{#if openItems.length > 0}
		<section class="group" aria-labelledby="open-heading">
			<h2 id="open-heading">
				{checklist.routing ? 'To route' : 'Planned'}
				<span class="count">{openItems.length}</span>
			</h2>
			<ul
				class="rows"
				class:saving
				bind:this={openListEl}
				aria-label={checklist.routing ? 'To route' : 'Planned'}
				aria-busy={saving}
				use:dragHandleZone={{
					items: openItems,
					flipDurationMs,
					type: 'checklist-open',
					dragDisabled: !canDrag,
					dropFromOthersDisabled: true,
					// Kill default yellow outline "glow" on the list while dragging.
					dropTargetStyle: {},
					// Tall rows + morph = chunky flings; keep ghost stable.
					morphDisabled: true,
					// Skip diagonal settle animation (left/right snap then flicker).
					dropAnimationDisabled: true,
					centreDraggedOnCursor: false,
					// Handle is intentional — no long-press delay (NN/g: separate drag from swipe).
					delayTouchStart: false,
					transformDraggedElement: styleChecklistDragGhost,
					useCursorForDetection: true
				}}
				onconsider={onConsider}
				onfinalize={onFinalize}
			>
				{#each openItems as item (item.id)}
					<li class="row-wrap" aria-label={item.name}>
						<ChecklistRow
							{item}
							{currency}
							destination={destinationFor(item.destinationId)}
							installment={installmentLabel(item.templateId)}
							routing={checklist.routing}
							showHandle={showHandles}
							ontoggle={checklist.toggle(item)}
							ondelete={() => checklist.remove(item)}
						/>
						{#if checklist.routing && item.decision !== 'SKIPPED' && !item.isDone}
							<div class="decisions"><DecisionChips {item} /></div>
						{/if}
					</li>
				{/each}
			</ul>
			{#if showHandles}
				<p class="hint">Drag the handle to reorder.</p>
			{/if}
		</section>
	{/if}
	{#if checklist.paid.length > 0}
		{@render staticSection('Routed', `${checklist.paid.length}`, checklist.paid, 'done')}
	{/if}
	{#if checklist.skipped.length > 0}
		{@render staticSection('Skipped', `${checklist.skipped.length}`, checklist.skipped, 'skipped')}
	{/if}
</div>

<style>
	.checklist {
		display: grid;
		gap: var(--space-8);
	}

	.group {
		display: grid;
		gap: var(--space-5);
	}

	h2 {
		font-size: 1.45rem;
	}

	.count {
		margin-left: var(--space-1);
		color: var(--text-dim);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.75rem;
		align-items: stretch;
	}

	.row-wrap {
		min-width: 0;
		min-height: 0;
		height: 100%;
		display: grid;
		align-content: start;
	}

	.decisions {
		padding: 0.5rem 0.75rem 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border-subtle);
		border-top: 0;
		border-radius: 0 0 1rem 1rem;
	}

	/* Block cards while reorder POST is in flight — no opacity flash. */
	.rows.saving {
		pointer-events: none;
	}

	@media (min-width: 640px) {
		.rows {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.875rem;
		}
	}

	@media (min-width: 1024px) {
		.rows {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.875rem;
		}
	}

	.hint {
		margin: 0;
		color: var(--text-dim);
		font-size: var(--text-sm);
	}

	.empty {
		padding: var(--space-6);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		text-align: center;
	}

	/* Ghost: flat, no glow — X locked in JS; library owns translate3d. */
	:global(.checklist-drag-ghost) {
		cursor: grabbing !important;
		z-index: 20;
		pointer-events: none;
		opacity: 1;
		box-shadow: none !important;
		outline: none !important;
		filter: none !important;
		background: var(--surface);
	}

	:global(.checklist-drag-ghost *) {
		box-shadow: none !important;
	}
</style>
