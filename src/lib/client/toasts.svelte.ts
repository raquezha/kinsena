export interface ToastAction {
	label: string;
	run: () => void | Promise<void>;
}

export interface Toast {
	id: number;
	message: string;
	tone: 'info' | 'error';
	action?: ToastAction;
}

const DISMISS_AFTER_MS = 5000;

class Toasts {
	items: Toast[] = $state([]);
	#nextId = 1;
	#timers = new Map<number, ReturnType<typeof setTimeout>>();

	show(message: string, options: { tone?: Toast['tone']; action?: ToastAction } = {}) {
		const toast: Toast = { id: this.#nextId++, message, tone: options.tone ?? 'info', ...options };
		const kept = options.action ? this.items.filter((item) => !item.action) : this.items;
		this.items = [...kept.slice(-2), toast];
		this.#timers.set(
			toast.id,
			setTimeout(() => this.dismiss(toast.id), DISMISS_AFTER_MS)
		);
		return toast.id;
	}

	error(message: string) {
		return this.show(message, { tone: 'error' });
	}

	dismiss(id: number) {
		clearTimeout(this.#timers.get(id));
		this.#timers.delete(id);
		this.items = this.items.filter((toast) => toast.id !== id);
	}
}

/** One toast queue for the whole app. */
export const toasts = new Toasts();
