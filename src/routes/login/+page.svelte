<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import Logo from '#lib/ui/brand/Logo.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
	let attempt = $state(0);
</script>

<svelte:head>
	<title>Kinsena · Sign in</title>
</svelte:head>

<main class="login">
	<div class="glow" aria-hidden="true"></div>
	<section class="card" in:fly={{ y: 16, duration: 420 }}>
		<Logo size={72} animate />
		<h1>Kinsena</h1>
		<p class="tagline">Your payday checklist</p>
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
					attempt += 1;
				};
			}}
		>
			<label class="field">
				<span>Passphrase</span>
				<input
					class="input"
					type="password"
					name="password"
					autocomplete="current-password"
					required
					aria-invalid={form?.error ? 'true' : undefined}
					aria-describedby={form?.error ? 'login-error' : undefined}
				/>
			</label>
			{#if form?.error}
				{#key attempt}
					<p id="login-error" class="form-error shake" role="alert">{form.error}</p>
				{/key}
			{/if}
			<button class="button primary block" type="submit" disabled={submitting}>
				{submitting ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
		<p class="hint">One private passphrase, set on your server.</p>
	</section>
</main>

<style>
	.login {
		position: relative;
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: calc(var(--safe-top) + var(--space-6)) var(--space-5)
			calc(var(--safe-bottom) + var(--space-6));
		overflow: hidden;
	}

	.glow {
		position: absolute;
		inset: -20% -40% auto;
		height: 70%;
		background: radial-gradient(circle at 50% 40%, rgb(181 216 193 / 0.16), transparent 60%);
		animation: breathe 7s ease-in-out infinite alternate;
	}

	.card {
		position: relative;
		width: min(100%, 380px);
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		padding: var(--space-8) var(--space-6);
		background: rgb(19 26 22 / 0.82);
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-card);
		backdrop-filter: blur(12px);
	}

	h1 {
		margin-top: var(--space-3);
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.03em;
	}

	.tagline {
		color: var(--text-muted);
	}

	form {
		width: 100%;
		display: grid;
		gap: var(--space-4);
		margin-top: var(--space-5);
	}

	.hint {
		margin-top: var(--space-3);
		color: var(--text-dim);
		font-size: var(--text-xs);
	}

	.shake {
		animation: shake 360ms var(--ease-out);
	}

	@keyframes shake {
		20%,
		60% {
			transform: translateX(-6px);
		}
		40%,
		80% {
			transform: translateX(6px);
		}
	}

	@keyframes breathe {
		to {
			transform: scale(1.12);
			opacity: 0.7;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glow,
		.shake {
			animation: none;
		}
	}
</style>
