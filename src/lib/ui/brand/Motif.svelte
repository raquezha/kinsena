<script lang="ts">
	let { kind = 'star', size = 12 }: { kind?: 'star' | 'heart'; size?: number } = $props();
</script>

<svg
	class="motif"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	aria-hidden="true"
	focusable="false"
>
	{#if kind === 'heart'}
		<path
			d="M12 20s-7-4.4-7-9.2C5 8 6.8 6.4 9 6.4c1.3 0 2.3.6 3 1.6
			   .7-1 1.7-1.6 3-1.6 2.2 0 4 1.6 4 4.4C19 15.6 12 20 12 20Z"
			fill="currentColor"
		/>
	{:else}
		<path
			d="M12 2.4 14.3 8l6.2.6-4.7 4.1 1.4 6.1L12 15.8 6.8 18.8l1.4-6.1
			   L3.5 8.6 9.7 8 12 2.4Z"
			fill="currentColor"
		/>
	{/if}
</svg>

<style>
	.motif {
		display: block;
		flex: none;
	}
</style>
