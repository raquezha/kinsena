<script lang="ts">
	import { page } from '$app/state';
	import Logo from '#lib/ui/brand/Logo.svelte';
</script>

<svelte:head>
	<title>Kinsena · {page.status}</title>
</svelte:head>

<main class="error-page">
	<Logo size={56} />
	<h1>{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
	<p>{page.error?.message}</p>
	<a class="button primary" href="/">Back to checklist</a>
</main>

<style>
	.error-page {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--space-4);
		padding: var(--space-6);
		text-align: center;
	}

	p {
		color: var(--text-muted);
	}
</style>
