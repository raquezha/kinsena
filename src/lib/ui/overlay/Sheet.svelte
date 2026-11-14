<script lang="ts">
	import { tick, untrack, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Icon from '../icons/Icon.svelte';
	import { SheetMotion } from './sheet-motion.svelte.ts';

	let {
		open,
		title,
		description,
		closeHref,
		onclose,
		children
	}: {
		open: boolean;
		title: string;
		description?: string;
		/** Where the close button goes without JavaScript. */
		closeHref: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	const uid = $props.id();
	const phone = new MediaQuery('max-width: 639.98px');
	const motion = new SheetMotion(untrack(() => (open ? 1 : 0)));
	let dialog: HTMLDialogElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();
	let rendered = $state(untrack(() => open));
	// Server-rendered sheets start with the open attribute so they work without JavaScript.
	// Spread it once so Svelte never rewrites it: clearing `open` on a modal dialog
	// leaves it stuck in the top layer, ignoring Escape.
	const serverAttributes = untrack(() => (open ? { open: true } : {}));

	async function show() {
		rendered = true;
		await tick();
		if (!dialog) return;
		if (dialog.open) dialog.close(); // opened by the server without JS
		dialog.showModal();
		document.body.classList.add('scroll-locked');
		await motion.enter();
	}

	async function hide() {
		const finished = await motion.exit();
		if (!finished || open) return; // reopened while closing
		dialog?.close();
		document.body.classList.remove('scroll-locked');
		rendered = false;
	}

	$effect(() => {
		if (open) void show();
		else if (rendered) void hide();
	});

	$effect(() => () => document.body.classList.remove('scroll-locked'));

	function onCancel(event: Event) {
		event.preventDefault(); // animate out instead of closing instantly
		onclose();
	}

	function onPointerDown(event: PointerEvent) {
		if (!phone.current || event.button !== 0) return;
		if ((event.target as HTMLElement).closest('a, button')) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		motion.startDrag(event.clientY, panel?.offsetHeight ?? 1);
	}

	function onPointerUp() {
		if (motion.endDrag()) onclose();
	}

	function onCloseClick(event: MouseEvent) {
		event.preventDefault();
		onclose();
	}
</script>

{#if rendered}
	<dialog
		bind:this={dialog}
		class="sheet-layer"
		{...serverAttributes}
		aria-labelledby="{uid}-title"
		aria-describedby={description ? `${uid}-description` : undefined}
		oncancel={onCancel}
		style:--t={motion.current}
	>
		<!-- Escape closes the sheet for keyboard users; this is the pointer equivalent. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="backdrop" onclick={onclose}></div>
		<section bind:this={panel} class="panel" class:dragging={motion.dragging}>
			<!-- Dragging is a pointer shortcut; the close button and Escape do the same. -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<header
				class="grab"
				onpointerdown={onPointerDown}
				onpointermove={(event) => motion.drag(event.clientY)}
				onpointerup={onPointerUp}
				onpointercancel={onPointerUp}
			>
				<div class="handle" aria-hidden="true"></div>
				<div class="title-row">
					<h2 id="{uid}-title">{title}</h2>
					<a class="close" href={closeHref} onclick={onCloseClick} aria-label="Close">
						<Icon name="close" size={18} />
					</a>
				</div>
				{#if description}
					<p id="{uid}-description" class="description">{description}</p>
				{/if}
			</header>
			<div class="body">
				{@render children()}
			</div>
		</section>
	</dialog>
{/if}

<style>
	.sheet-layer {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.sheet-layer::backdrop {
		background: transparent;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: var(--scrim);
		backdrop-filter: blur(6px);
		opacity: clamp(0, var(--t), 1);
	}

	.panel {
		position: relative;
		width: 100%;
		max-height: calc(100dvh - var(--safe-top) - 24px);
		display: flex;
		flex-direction: column;
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-bottom: 0;
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		box-shadow: 0 -16px 48px rgb(0 0 0 / 0.55);
		padding-bottom: var(--safe-bottom);
		transform: translateY(calc((1 - var(--t)) * 100%));
		will-change: transform;
	}

	.grab {
		padding: var(--space-2) var(--space-5) var(--space-2);
		touch-action: none;
		cursor: grab;
		user-select: none;
	}

	.dragging .grab {
		cursor: grabbing;
	}

	.handle {
		width: 40px;
		height: 5px;
		border-radius: 999px;
		background: var(--border-strong);
		margin: 2px auto var(--space-3);
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	h2 {
		font-size: var(--text-lg);
		font-weight: 750;
	}

	.description {
		margin-top: var(--space-1);
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.close {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--surface-hover);
		color: var(--text-muted);
	}

	.body {
		padding: var(--space-3) var(--space-5) var(--space-6);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	/* Tablet: a centered dialog that scales in */
	@media (min-width: 640px) {
		.sheet-layer {
			align-items: center;
			padding: var(--space-6);
		}

		.panel {
			max-width: 480px;
			border: 1px solid var(--border);
			border-radius: var(--radius-xl);
			box-shadow: var(--shadow-float);
			padding-bottom: 0;
			opacity: clamp(0, var(--t), 1);
			transform: translateY(calc((1 - var(--t)) * 24px)) scale(calc(0.96 + 0.04 * var(--t)));
		}

		.handle {
			display: none;
		}

		.grab {
			padding-top: var(--space-5);
			cursor: default;
		}
	}

	/* Desktop: a side panel that slides in from the right */
	@media (min-width: 1100px) {
		.sheet-layer {
			justify-content: flex-end;
			align-items: stretch;
			padding: var(--space-3);
		}

		.panel {
			max-width: 420px;
			max-height: none;
			height: 100%;
			transform: translateX(calc((1 - var(--t)) * 110%));
			opacity: 1;
		}

		.backdrop {
			backdrop-filter: none;
			background: rgb(2 5 3 / 0.45);
		}
	}
</style>
