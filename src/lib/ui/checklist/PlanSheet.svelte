<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { formatEdit, formatMoney } from '../../domain/money.ts';
	import type { Decision } from '../../domain/decision.ts';
	import { DECISION_LABELS } from '../../domain/decision.ts';
	import type { PlanProposal, ProposalLine } from '../../domain/planner.ts';
	import { formatPaydayShort } from '../../domain/calendar.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let {
		open,
		paydayId,
		plan,
		currency
	}: {
		open: boolean;
		paydayId: number;
		plan: PlanProposal | null;
		currency: CurrencyCode;
	} = $props();

	let lines = $state<(Omit<ProposalLine, 'decision'> & { decision: Decision })[]>([]);
	$effect(() => {
		if (open && plan) lines = plan.lines.map((line) => ({ ...line }));
	});

	const total = $derived(
		lines.reduce((sum, line) => sum + (line.decision === 'SKIPPED' ? 0 : line.amount), 0)
	);
	const salary = $derived(plan && plan.leftover !== null ? plan.leftover + plan.total : null);
	const leftover = $derived(salary === null ? null : salary - total);

	const form = new FormState();
	const choices = ['FULL', 'MINIMUM', 'SKIPPED'] as const;
	const payload = $derived(
		JSON.stringify(
			lines.map((line) => ({
				itemId: line.itemId,
				decision: line.decision,
				amount: line.amount,
				reason: line.reason
			}))
		)
	);

	function setDecision(index: number, decision: Decision) {
		const line = lines[index];
		if (!line) return;
		if (decision === 'SKIPPED') {
			lines[index] = { ...line, decision: 'SKIPPED', amount: 0, reason: 'Skip: set by you' };
			return;
		}
		if (decision === 'MINIMUM') {
			if (line.minimumAmount === null) return;
			lines[index] = {
				...line,
				decision: 'MINIMUM',
				amount: line.minimumAmount,
				reason: 'Minimum: set by you'
			};
			return;
		}
		if (decision === 'FULL') {
			if (line.fullAmount === null) return;
			lines[index] = {
				...line,
				decision: 'FULL',
				amount: line.fullAmount,
				reason: 'Full: set by you'
			};
		}
	}

	function setAmount(index: number, raw: string) {
		const line = lines[index];
		if (!line) return;
		const cents = Math.round(Number(raw.replace(/,/g, '')) * 100);
		if (!Number.isFinite(cents) || cents < 0) return;
		let decision: Decision = 'CUSTOM';
		if (cents === 0) decision = 'SKIPPED';
		else if (line.fullAmount !== null && cents === line.fullAmount) decision = 'FULL';
		else if (line.minimumAmount !== null && cents === line.minimumAmount) decision = 'MINIMUM';
		lines[index] = { ...line, amount: cents, decision, reason: 'Amount set by you' };
	}
</script>

<Sheet
	{open}
	title="Proposed split"
	description="Nothing is routed until you approve. You can tweak a line first."
	closeHref="./"
	onclose={closeSheet}
>
	{#if plan && lines.length > 0}
		<form
			method="POST"
			action="?/approvePlan"
			class="stack"
			use:enhance={form.enhance({ success: 'Plan approved' })}
		>
			<input type="hidden" name="paydayId" value={paydayId} />
			<input type="hidden" name="plan" value={payload} />
			<p class="totals" class:over={leftover !== null && leftover < 0}>
				{#if leftover !== null}
					{leftover < 0 ? 'Over salary by' : 'Left after this split'}
					{formatMoney(Math.abs(leftover), currency)}
				{:else}
					Total {formatMoney(total, currency)}
				{/if}
			</p>
			<ul class="lines">
				{#each lines as line, index (line.itemId)}
					<li class="line">
						<div class="head">
							<strong>{line.name}</strong>
							{#if line.destinationName}
								<span class="meta">{line.destinationName}</span>
							{/if}
							{#if line.dueDate}
								<span class="meta">Due {formatPaydayShort(line.dueDate)}</span>
							{/if}
						</div>
						<p class="reason">{line.reason}</p>
						<div class="edit">
							<div class="segmented cols-3" role="group" aria-label="Decision for {line.name}">
								{#each choices as decision (decision)}
									<button
										class="segment"
										class:active={line.decision === decision}
										class:skip={decision === 'SKIPPED'}
										type="button"
										onclick={() => setDecision(index, decision)}
									>
										{DECISION_LABELS[decision]}
									</button>
								{/each}
							</div>
							{#if line.decision !== 'SKIPPED'}
								<label class="amount">
									<span class="visually-hidden">Amount for {line.name}</span>
									<input
										class="input money"
										inputmode="decimal"
										value={formatEdit(line.amount)}
										oninput={(event) => setAmount(index, event.currentTarget.value)}
									/>
								</label>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
			{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
			<button class="button primary block" type="submit" disabled={form.busy}>Approve all</button>
			<button class="button ghost block" type="button" onclick={closeSheet}>Reject</button>
		</form>
	{:else}
		<p class="empty">No items to split on this payday.</p>
		<button class="button ghost block" type="button" onclick={closeSheet}>Close</button>
	{/if}
</Sheet>

<style>
	.totals {
		margin: 0;
		font-weight: 700;
	}

	.totals.over {
		color: var(--danger);
	}

	.lines {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-5);
	}

	.line {
		padding-bottom: var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: baseline;
	}

	.meta,
	.reason {
		color: var(--text-dim);
		font-size: var(--text-sm);
	}

	.reason {
		margin: var(--space-1) 0 var(--space-3);
	}

	.edit {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
	}

	.amount {
		flex: 1;
		min-width: 8rem;
	}

	.empty {
		color: var(--text-muted);
	}
</style>
