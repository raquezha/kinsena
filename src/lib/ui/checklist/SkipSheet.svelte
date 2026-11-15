<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { closeSheet } from '../../client/sheet-route.ts';
	import type { RouteItem } from '../../domain/models.ts';
	import { skipPastDueWarning } from '../../domain/summary.ts';
	import { formatCycleDate } from './dates.ts';
	import Sheet from '../overlay/Sheet.svelte';

	let {
		item,
		nextScheduledDate
	}: { item: RouteItem | undefined; nextScheduledDate: string | null } = $props();

	const skip = new FormState();
	const move = new FormState();
	let shown: RouteItem | undefined = $state();
	$effect(() => {
		if (item) shown = item;
	});

	const warning = $derived(skipPastDueWarning(shown?.dueDate ?? null, nextScheduledDate));
</script>

<Sheet
	open={item !== undefined}
	title="Skip {shown?.name ?? 'item'}"
	description="Leave it here as skipped, or move it to the next payday."
	closeHref="./"
	onclose={closeSheet}
>
	{#if shown}
		<div class="stack">
			{#if warning}
				<p class="warning" role="status">{warning}</p>
			{/if}
			{#if nextScheduledDate}
				<p class="lead">
					Next payday is {formatCycleDate(nextScheduledDate)}.
				</p>
			{/if}
			<form
				method="POST"
				action="?/skip"
				use:enhance={move.enhance({ success: 'Moved to the next payday' })}
			>
				<input type="hidden" name="itemId" value={shown.id} />
				<input type="hidden" name="moveToNext" value="true" />
				<button class="button primary block" type="submit" disabled={move.busy}>
					Move to next payday
				</button>
			</form>
			<form method="POST" action="?/skip" use:enhance={skip.enhance({ success: 'Skipped' })}>
				<input type="hidden" name="itemId" value={shown.id} />
				<input type="hidden" name="moveToNext" value="false" />
				<button class="button block" type="submit" disabled={skip.busy}>Skip this payday</button>
			</form>
			{#if skip.error || move.error}
				<p class="form-error" role="alert">{skip.error ?? move.error}</p>
			{/if}
		</div>
	{/if}
</Sheet>

<style>
	.lead {
		color: var(--text-muted);
	}

	.warning {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		background: var(--notice-soft);
		color: var(--notice);
		font-size: var(--text-sm);
		font-weight: 600;
	}
</style>
