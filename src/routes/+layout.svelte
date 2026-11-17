<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import '@fontsource-variable/inter/wght.css';
	import '#lib/ui/styles/tokens.css';
	import '#lib/ui/styles/base.css';
	import '#lib/ui/styles/controls.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Cross-fade between tabs / paydays with the View Transitions API where supported.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		const from = navigation.from?.url;
		const to = navigation.to?.url;
		if (!from || !to) return;
		const samePath = from.pathname === to.pathname;
		const samePayday = from.searchParams.get('p') === to.searchParams.get('p');
		// Same route + same payday (e.g. sheet open/close) — no page morph.
		if (samePath && samePayday) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{@render children()}
