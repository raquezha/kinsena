<script lang="ts">
	import { enhance } from '$app/forms';
	import { openSheet } from '../../client/sheet-route.ts';
	import type { Decision } from '../../domain/decision.ts';
	import { DECISION_LABELS } from '../../domain/decision.ts';
	import type { RouteItem } from '../../domain/models.ts';

	let { item }: { item: RouteItem } = $props();

	const chips: { decision: Decision; label: string; spoken: string }[] = [
		{ decision: 'FULL', label: 'Bayad', spoken: DECISION_LABELS.FULL },
		{ decision: 'MINIMUM', label: 'Min', spoken: DECISION_LABELS.MINIMUM },
		{ decision: 'CUSTOM', label: 'Custom', spoken: DECISION_LABELS.CUSTOM },
		{ decision: 'SKIPPED', label: 'Para muna', spoken: DECISION_LABELS.SKIPPED }
	];

	function onCustomOrSkip(event: MouseEvent, decision: Decision) {
		if (decision !== 'CUSTOM' && decision !== 'SKIPPED') return;
		event.preventDefault();
		void openSheet(decision === 'CUSTOM' ? `custom-${item.id}` : `skip-${item.id}`);
	}
</script>

<div class="chips" role="group" aria-label="Routing decision for {item.name}">
	{#each chips as chip (chip.decision)}
		<form method="POST" action="?/decide" use:enhance>
			<input type="hidden" name="itemId" value={item.id} />
			<input type="hidden" name="decision" value={chip.decision} />
			<button
				id="decide-{chip.decision === 'FULL'
					? 'full'
					: chip.decision === 'MINIMUM'
						? 'min'
						: chip.decision.toLowerCase()}-{item.id}"
				class="chip"
				class:active={item.decision === chip.decision}
				class:skip={chip.decision === 'SKIPPED'}
				type="submit"
				aria-label={chip.spoken}
				onclick={(event) => onCustomOrSkip(event, chip.decision)}
			>
				{chip.label}
			</button>
		</form>
	{/each}
</div>

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.chip {
		min-height: 44px;
		padding: 0 var(--space-3);
		border-radius: 2px;
		border: 2px solid var(--border);
		background: var(--surface-sunken);
		color: var(--text-muted);
		font-family: var(--font-display);
		font-size: 0.95rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		font-weight: 400;
	}

	.chip.active {
		background: var(--accent);
		border-color: var(--accent-ink);
		color: var(--accent-ink);
	}

	.chip.skip.active {
		background: var(--brand-red);
		border-color: var(--accent-ink);
		color: var(--brand-red-ink);
	}
</style>
