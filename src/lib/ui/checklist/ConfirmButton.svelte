<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';

	let {
		action,
		fields,
		confirm,
		tone = 'default',
		onsubmit,
		children
	}: {
		action: string;
		fields: Record<string, string | number>;
		/** Shown on the second step, e.g. "Yes, finish this cycle". */
		confirm: string;
		tone?: 'default' | 'danger';
		onsubmit: SubmitFunction;
		children: Snippet;
	} = $props();

	let asking = $state(false);
</script>

<form method="POST" {action} use:enhance={onsubmit}>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	{#if asking}
		<div class="confirm" transition:slide={{ duration: 200 }}>
			<button
				class="button block"
				class:danger={tone === 'danger'}
				class:primary={tone !== 'danger'}
				type="submit"
			>
				{confirm}
			</button>
			<button class="button ghost block" type="button" onclick={() => (asking = false)}>
				Cancel
			</button>
		</div>
	{:else}
		<button
			class="button block"
			class:danger={tone === 'danger'}
			type="button"
			onclick={() => (asking = true)}
		>
			{@render children()}
		</button>
		<noscript><button class="button block" type="submit">{confirm}</button></noscript>
	{/if}
</form>

<style>
	.confirm {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-2);
	}
</style>
