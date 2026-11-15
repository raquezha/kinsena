<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import '#lib/ui/styles/fonts.css';
	import '#lib/ui/styles/tokens.css';
	import '#lib/ui/styles/base.css';
	import '#lib/ui/styles/controls.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Cross-fade between tabs with the View Transitions API where supported.
	onNavigate((navigation) => {
		const samePage = navigation.from?.url.pathname === navigation.to?.url.pathname;
		if (samePage || !document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{@render children()}
