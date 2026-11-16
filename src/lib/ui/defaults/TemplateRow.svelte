<script lang="ts">
	import { enhance } from '$app/forms';
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { FUND_FROM_LABELS } from '../../domain/fund-from.ts';
	import type { Destination, TemplateItem } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import { getRecurringIcon } from '../../domain/recurring-icon.ts';
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
	const icon = $derived(getRecurringIcon(template.name, destination?.kind));
	const amountLabel = $derived(
		template.defaultAmount === null ? 'Varies' : formatMoney(template.defaultAmount, currency)
	);
	const scheduleLabel = $derived.by(() => {
		const parts = [FUND_FROM_LABELS[template.fundFrom]];
		if (template.dueDay) parts.push(`Due day ${template.dueDay}`);
		if (template.installmentCount !== null) {
			parts.push(`${template.installmentsCompleted} of ${template.installmentCount}`);
		}
		return parts.join(' · ');
	});

	/** Optimistic override until the server refresh lands. */
	let pendingActive: boolean | null = $state(null);
	const active = $derived(pendingActive ?? template.isActive);

	function openEditor(event: MouseEvent) {
		event.preventDefault();
		void openSheet(sheet);
	}
</script>

<div class="card" class:paused={!active}>
	<a
		class="body"
		href={sheetHref(sheet)}
		data-sveltekit-noscroll
		onclick={openEditor}
		aria-label={`Edit ${template.name}`}
	>
		<div class="top">
			<span class="identity">
				<span class="glyph" aria-hidden="true"><Icon name={icon} size={16} /></span>
				<span class="name">{template.name}</span>
			</span>
			<span class="toggle-spacer" aria-hidden="true"></span>
		</div>
		<p class="schedule">{scheduleLabel}</p>
		<div class="divider" aria-hidden="true"></div>
		<div class="bottom">
			{#if destination}
				<span class="pill">
					<span class="arrow" aria-hidden="true">→</span>
					<span class="dest">{destination.name}</span>
				</span>
			{:else}
				<span class="pill muted">
					<span class="arrow" aria-hidden="true">→</span>
					<span class="dest">No destination</span>
				</span>
			{/if}
			<span class="amount tabular">{amountLabel}</span>
		</div>
	</a>

	<form
		class="toggle-form"
		method="POST"
		action="?/toggleActive"
		use:enhance={() => {
			const next = !active;
			pendingActive = next;
			return async ({ result, update }) => {
				if (result.type === 'success') {
					await update({ reset: false, navigate: false });
					pendingActive = null;
					return;
				}
				pendingActive = null;
			};
		}}
	>
		<input type="hidden" name="templateId" value={template.id} />
		<button
			type="submit"
			class="toggle"
			class:on={active}
			role="switch"
			aria-checked={active}
			aria-label={active ? `Pause ${template.name}` : `Activate ${template.name}`}
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => event.stopPropagation()}
		>
			<span class="thumb"></span>
		</button>
	</form>
</div>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		background: var(--surface);
		transition:
			border-color var(--duration-fast) var(--ease-out),
			opacity var(--duration-fast) var(--ease-out);
	}

	.card:hover {
		border-color: var(--border);
	}

	.card.paused {
		opacity: 0.5;
	}

	.body {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-between;
		min-width: 0;
		padding: var(--space-4);
		padding-right: calc(var(--space-4) + 2.5rem);
		color: inherit;
		text-decoration: none;
	}

	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.identity {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.glyph {
		flex-shrink: 0;
		color: var(--accent);
	}

	.card.paused .glyph {
		color: rgb(255 255 255 / 0.4);
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text);
	}

	.toggle-spacer {
		flex-shrink: 0;
		width: 2.25rem;
		height: 1.25rem;
	}

	.schedule {
		margin: 6px 0 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--text-xs);
		color: rgb(255 255 255 / 0.5);
	}

	.divider {
		margin: var(--space-3) 0;
		border-top: 1px solid rgb(255 255 255 / 0.06);
	}

	.bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		max-width: 65%;
		min-width: 0;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: color-mix(in srgb, var(--accent) 90%, transparent);
		font-size: var(--text-xs);
		font-weight: 500;
	}

	.pill.muted,
	.card.paused .pill {
		background: rgb(255 255 255 / 0.05);
		color: rgb(255 255 255 / 0.4);
	}

	.arrow {
		flex-shrink: 0;
	}

	.dest {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.amount {
		flex-shrink: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text);
	}

	.toggle-form {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
		margin: 0;
	}

	.toggle {
		position: relative;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		width: 2.25rem;
		height: 1.25rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.1);
		cursor: pointer;
		transition: background-color var(--duration-fast) var(--ease-out);
	}

	.toggle.on {
		background: var(--accent);
	}

	.thumb {
		display: block;
		width: 0.875rem;
		height: 0.875rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.5);
		transform: translateX(0.2rem);
		transition:
			transform var(--duration-fast) var(--ease-out),
			background-color var(--duration-fast) var(--ease-out);
	}

	.toggle.on .thumb {
		background: var(--surface);
		transform: translateX(1.15rem);
	}
</style>
