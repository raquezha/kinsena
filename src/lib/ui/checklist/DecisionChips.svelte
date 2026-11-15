<script lang="ts">
	import { enhance } from '$app/forms';
	import { undoEnhance } from '../../client/undo.svelte.ts';
	import { openSheet } from '../../client/sheet-route.ts';
	import type { Decision } from '../../domain/decision.ts';
	import { DECISION_LABELS } from '../../domain/decision.ts';
	import type { RouteItem } from '../../domain/models.ts';

	let { item }: { item: RouteItem } = $props();

	const chips: { decision: Decision; label: string }[] = [
		{ decision: 'FULL', label: DECISION_LABELS.FULL },
		{ decision: 'MINIMUM', label: DECISION_LABELS.MINIMUM },
		{ decision: 'CUSTOM', label: DECISION_LABELS.CUSTOM },
		{ decision: 'SKIPPED', label: DECISION_LABELS.SKIPPED }
	];

	function onCustomOrSkip(event: MouseEvent, decision: Decision) {
		if (decision !== 'CUSTOM' && decision !== 'SKIPPED') return;
		event.preventDefault();
		void openSheet(decision === 'CUSTOM' ? `custom-${item.id}` : `skip-${item.id}`);
	}
</script>

<div class="segmented" role="group" aria-label="Routing decision for {item.name}">
	{#each chips as chip (chip.decision)}
		<form method="POST" action="?/decide" use:enhance={undoEnhance('Decision saved')}>
			<input type="hidden" name="itemId" value={item.id} />
			<input type="hidden" name="decision" value={chip.decision} />
			<button
				id="decide-{chip.decision === 'FULL'
					? 'full'
					: chip.decision === 'MINIMUM'
						? 'min'
						: chip.decision.toLowerCase()}-{item.id}"
				class="segment"
				class:active={item.decision === chip.decision}
				class:skip={chip.decision === 'SKIPPED'}
				type="submit"
				onclick={(event) => onCustomOrSkip(event, chip.decision)}
			>
				{chip.label}
			</button>
		</form>
	{/each}
</div>
