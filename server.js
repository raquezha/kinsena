// Production entry point. Serves the SvelteKit build on loopback by default.
// Set HOST and PORT to override; never expose Kinsena directly to the internet.
import { createServer } from 'node:http';
import { handler } from './build/handler.js';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 8080);

const server = createServer(handler);

server.listen(port, host, () => {
	console.log(`Kinsena listening on http://${host.includes(':') ? `[${host}]` : host}:${port}`);
});

function shutdown(signal) {
	console.log(`${signal} received, closing`);
	server.close(() => process.exit(0));
	setTimeout(() => process.exit(0), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
