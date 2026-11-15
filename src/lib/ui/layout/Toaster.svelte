<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { toasts } from '../../client/toasts.svelte.ts';
	import Icon from '../icons/Icon.svelte';

	async function runAction(id: number, run: () => void | Promise<void>) {
		toasts.dismiss(id);
		await run();
	}
</script>

<div class="toaster" role="status" aria-live="polite">
	{#each toasts.items as toast (toast.id)}
		<div
			class="toast"
			class:error={toast.tone === 'error'}
			animate:flip={{ duration: 220 }}
			in:fly={{ y: 24, duration: 260 }}
			out:fly={{ y: 12, duration: 180 }}
		>
			<span class="message">{toast.message}</span>
			{#if toast.action}
				{@const action = toast.action}
				<button type="button" class="action" onclick={() => runAction(toast.id, action.run)}>
					<Icon name="undo" size={16} />
					{action.label}
				</button>
			{/if}
			<button
				type="button"
				class="dismiss"
				aria-label="Dismiss"
				onclick={() => toasts.dismiss(toast.id)}
			>
				<Icon name="close" size={16} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		z-index: var(--z-toast);
		left: 50%;
		bottom: calc(var(--nav-height) + var(--safe-bottom) + var(--space-4));
		transform: translateX(-50%);
		width: min(calc(100% - 2 * var(--space-4)), 420px);
		display: grid;
		gap: var(--space-2);
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 52px;
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
		background: #212b25;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-float);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.toast.error {
		border-color: rgb(243 170 164 / 0.4);
		color: var(--danger);
	}

	.message {
		flex: 1;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 40px;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--accent);
		font-weight: 700;
	}

	.dismiss {
		color: var(--text-dim);
		padding: 0 var(--space-2);
	}

	@media (min-width: 640px) {
		.toaster {
			bottom: var(--space-6);
		}
	}
</style>
