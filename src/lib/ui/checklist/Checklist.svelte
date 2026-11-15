<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { crossfade, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { failureMessage, postAction } from '../../client/actions.ts';
	import type { Checklist } from '../../client/checklist.svelte.ts';
	import { toasts } from '../../client/toasts.svelte.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Destination, RouteItem, TemplateItem } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';
	import ChecklistRow from './ChecklistRow.svelte';

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
		destinations: Destination[];
		templates: TemplateItem[];
	} = $props();

	const duration = () => (prefersReducedMotion.current ? 0 : 340);
	const [send, receive] = crossfade({
		duration,
		easing: cubicOut,
		fallback: (node) => slide(node, { duration: duration() })
	});

	/** While dragging open items, local id order; null means use checklist.unpaid. */
	let draftOpenIds = $state<number[] | null>(null);
	let draggingId = $state<number | null>(null);
	let saving = $state(false);

	const openItems = $derived.by((): RouteItem[] => {
		const source = checklist.unpaid;
		if (!draftOpenIds) return source;
		const byId = new Map(source.map((item) => [item.id, item]));
		return draftOpenIds.flatMap((id) => {
			const item = byId.get(id);
			return item ? [item] : [];
		});
	});

	function destinationFor(id: number | null) {
		return destinations.find((entry) => entry.id === id) ?? null;
	}

	function installmentLabel(templateId: number | null): string | null {
		if (templateId === null) return null;
		const template = templates.find((entry) => entry.id === templateId);
		if (!template || template.installmentCount === null) return null;
		return `${template.installmentsCompleted} of ${template.installmentCount}`;
	}

	function startDrag(event: PointerEvent, id: number) {
		if (event.button !== 0 || saving || checklist.unpaid.length < 2) return;
		event.preventDefault();
		const handle = event.currentTarget as HTMLElement;
		handle.setPointerCapture(event.pointerId);
		draftOpenIds = checklist.unpaid.map((item) => item.id);
		draggingId = id;
	}

	function moveDrag(event: PointerEvent) {
		if (draggingId === null || !draftOpenIds) return;
		const el = document.elementFromPoint(event.clientX, event.clientY);
		const row = el?.closest('[data-open-id]') as HTMLElement | null;
		if (!row) return;
		const overId = Number(row.dataset.openId);
		if (!Number.isInteger(overId) || overId === draggingId) return;
		const from = draftOpenIds.indexOf(draggingId);
		const to = draftOpenIds.indexOf(overId);
		if (from < 0 || to < 0 || from === to) return;
		const next = [...draftOpenIds];
		next.splice(from, 1);
		next.splice(to, 0, draggingId);
		draftOpenIds = next;
	}

	async function endDrag(event: PointerEvent) {
		if (draggingId === null || !draftOpenIds) return;
		const handle = event.currentTarget as HTMLElement;
		if (handle.hasPointerCapture(event.pointerId)) {
			handle.releasePointerCapture(event.pointerId);
		}
		const orderedIds = draftOpenIds;
		const changed =
			orderedIds.join(',') !== checklist.unpaid.map((item) => item.id).join(',');
		draggingId = null;
		if (!changed) {
			draftOpenIds = null;
			return;
		}
		saving = true;
		const result = await postAction('?/reorder', {
			paydayId,
			orderedIds: JSON.stringify(orderedIds)
		});
		const error = failureMessage(result);
		if (error) {
			draftOpenIds = null;
			saving = false;
			toasts.error(error);
			return;
		}
		await refreshAll();
		draftOpenIds = null;
		saving = false;
	}
</script>

{#snippet section(title: string, count: string, items: RouteItem[], kind: string)}
	<section class="group" aria-labelledby="{kind}-heading">
		<h2 id="{kind}-heading">{title} <span class="count">{count}</span></h2>
		<ul class="rows">
			{#each items as item (item.id)}
				<li
					class="row-wrap"
					class:dragging={kind === 'open' && item.id === draggingId}
					class:can-drag={kind === 'open' && items.length > 1}
					data-open-id={kind === 'open' ? item.id : undefined}
					animate:flip={{ duration: duration() }}
					in:receive={{ key: item.id }}
					out:send={{ key: item.id }}
				>
					{#if kind === 'open' && items.length > 1}
						<button
							class="grip"
							type="button"
							aria-label={`Drag to reorder ${item.name}`}
							disabled={saving}
							onpointerdown={(event) => startDrag(event, item.id)}
							onpointermove={moveDrag}
							onpointerup={endDrag}
							onpointercancel={endDrag}
						>
							<Icon name="grip" size={16} />
						</button>
					{/if}
					<div class="row-body">
						<ChecklistRow
							{item}
							{currency}
							destination={destinationFor(item.destinationId)}
							installment={installmentLabel(item.templateId)}
							routing={checklist.routing}
							ontoggle={checklist.toggle(item)}
							ondelete={() => checklist.remove(item)}
						/>
					</div>
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
		{@render section(
			checklist.routing ? 'To route' : 'Planned',
			`${openItems.length}`,
			openItems,
			'open'
		)}
	{/if}
	{#if checklist.paid.length > 0}
		{@render section('Routed', `${checklist.paid.length}`, checklist.paid, 'done')}
	{/if}
	{#if checklist.skipped.length > 0}
		{@render section('Skipped', `${checklist.skipped.length}`, checklist.skipped, 'skipped')}
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
		gap: var(--space-5);
	}

	.row-wrap {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-2);
		align-items: stretch;
	}

	.row-wrap.can-drag {
		grid-template-columns: auto minmax(0, 1fr);
	}

	.row-wrap.dragging {
		opacity: 0.72;
	}

	.grip {
		display: grid;
		place-items: center;
		align-self: center;
		width: 2rem;
		height: 2.5rem;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-dim);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.grip:active {
		cursor: grabbing;
		color: var(--text-muted);
	}

	.grip:disabled {
		opacity: 0.4;
	}

	.row-body {
		min-width: 0;
	}

	.empty {
		padding: var(--space-6);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		text-align: center;
	}
</style>
