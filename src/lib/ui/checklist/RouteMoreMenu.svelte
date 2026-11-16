<script lang="ts">
	import { enhance } from '$app/forms';
	import { undoEnhance } from '../../client/undo.svelte.ts';
	import { openSheet } from '../../client/sheet-route.ts';
	import type { Decision } from '../../domain/decision.ts';
	import { DECISION_LABELS } from '../../domain/decision.ts';
	import type { RouteItem } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';

	let { item }: { item: RouteItem } = $props();

	let open = $state(false);
	let rootEl = $state<HTMLDivElement | null>(null);
	/** Ignore the opening click so the menu does not instantly close. */
	let ignoreOutsideUntil = 0;

	const actions: { decision: Decision; label: string }[] = [
		{ decision: 'FULL', label: DECISION_LABELS.FULL },
		{ decision: 'MINIMUM', label: DECISION_LABELS.MINIMUM },
		{ decision: 'CUSTOM', label: DECISION_LABELS.CUSTOM },
		{ decision: 'SKIPPED', label: DECISION_LABELS.SKIPPED }
	];

	function stopSwipe(event: Event) {
		event.stopPropagation();
	}

	function toggle(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		open = !open;
		if (open) ignoreOutsideUntil = Date.now() + 50;
	}

	function close() {
		open = false;
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (!open || !rootEl) return;
		if (Date.now() < ignoreOutsideUntil) return;
		if (rootEl.contains(event.target as Node)) return;
		close();
	}

	function onWindowKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			close();
		}
	}

	function onCustomOrSkip(event: MouseEvent, decision: Decision) {
		if (decision !== 'CUSTOM' && decision !== 'SKIPPED') {
			close();
			return;
		}
		event.preventDefault();
		close();
		void openSheet(decision === 'CUSTOM' ? `custom-${item.id}` : `skip-${item.id}`);
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onWindowKeyDown} />

<div class="more" class:open bind:this={rootEl}>
	<button
		class="trigger"
		type="button"
		aria-label={`More routing actions for ${item.name}`}
		aria-haspopup="menu"
		aria-expanded={open}
		onpointerdown={stopSwipe}
		onclick={toggle}
	>
		<Icon name="more" size={14} />
	</button>
	{#if open}
		<div class="popover" role="menu" aria-label={`Routing options for ${item.name}`}>
			{#each actions as action (action.decision)}
				<form method="POST" action="?/decide" use:enhance={undoEnhance('Decision saved')}>
					<input type="hidden" name="itemId" value={item.id} />
					<input type="hidden" name="decision" value={action.decision} />
					<button
						class="option"
						class:skip={action.decision === 'SKIPPED'}
						type="submit"
						role="menuitem"
						onclick={(event) => onCustomOrSkip(event, action.decision)}
					>
						{action.label}
					</button>
				</form>
			{/each}
		</div>
	{/if}
</div>

<style>
	.more {
		position: relative;
		flex-shrink: 0;
		z-index: 1;
	}

	.more.open {
		z-index: 30;
	}

	.trigger {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border-radius: 0.4375rem;
		border: 1px solid rgb(255 255 255 / 0.1);
		background: rgb(255 255 255 / 0.04);
		color: var(--text-muted);
	}

	.more.open .trigger,
	.trigger:hover {
		border-color: rgb(255 255 255 / 0.18);
		color: var(--text);
		background: rgb(255 255 255 / 0.08);
	}

	.popover {
		position: absolute;
		top: calc(100% + 0.35rem);
		right: 0;
		z-index: 31;
		display: grid;
		width: 8rem;
		padding: 0.35rem;
		border-radius: 0.625rem;
		border: 1px solid rgb(255 255 255 / 0.12);
		background: #1e1c18;
		box-shadow: 0 12px 28px rgb(0 0 0 / 0.55);
	}

	.popover form {
		margin: 0;
	}

	.option {
		display: block;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: 0;
		border-radius: 0.4rem;
		background: transparent;
		color: var(--text);
		font-size: 0.8125rem;
		font-weight: 600;
		text-align: left;
	}

	.option:hover,
	.option:focus-visible {
		background: rgb(255 255 255 / 0.06);
	}

	.option.skip {
		color: var(--text-muted);
	}
</style>
