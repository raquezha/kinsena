# Kinsena

A small, self-hosted checklist for things you handle each payday. This is not a bank integration or an expense tracker. Add saved items once, start a cycle, enter amounts when known, and mark items done.

## Run

Requires JDK 21. From the repo root:

```bash
./gradlew run
```

Open http://127.0.0.1:8080. The server listens on loopback by default; it is not reachable from other devices without a protected gateway.

For Docker:

```bash
docker build -t kinsena .
docker run -d -p 127.0.0.1:8080:8080 -v "$(pwd)/data:/app/data" kinsena
```

All records are stored in `data/kinsena.db`. Docker needs the volume shown above to preserve them. Existing database files remain compatible; no migration or personal payees are added automatically to a new installation.

## Use

1. Add recurring item names under **Defaults**. Leave the amount blank for items that vary.
2. Start a cycle from **Active**. One cycle can be open at a time.
3. Enter an amount and tap **Save**, or tap the circle to mark an item paid. `10,538.91 + 3403` also works.
4. **Known total** and **remaining** exclude blank amounts; a warning counts them. Zero entered explicitly is different from blank.
5. Finish the cycle to keep a read-only record in **History**.

Values with more than two decimal places round half-up to cents. The app records what you confirm; it does not check your bank.

## Install on a phone

Kinsena has a web manifest and icons for an installable home-screen app. Use Safari's **Add to Home Screen** on iPhone, or the browser install action on other platforms. Remote installs need HTTPS. **Online only:** there is no offline cache; the app will not show an old payment state when disconnected.

## Private access and backups

There is **no built-in login**. Do not expose port 8080 to the internet or a shared LAN. To reach it from a phone, use an authenticated HTTPS gateway that proxies to loopback (or a private tunnel whose access you control). Set `HOST=0.0.0.0` inside a container only when the published host port is restricted as shown above. Protect the gateway against cross-site requests.

Make a consistent backup while the app is running with SQLite's backup command:

```bash
sqlite3 data/kinsena.db ".backup 'kinsena-backup.db'"
```

Keep backups on another device and periodically test a restore using a *copy* of the backup, not your live database. Stop the server before replacing the live database.

## Development

`./gradlew test` checks amounts, missing amounts, the HTTP payment flow, history protection, and install assets. The backend is Kotlin/Ktor, the database is SQLite/Exposed, and pages use server-rendered HTML and plain forms; there is no JavaScript build or third-party CDN.

## License

MIT. See [LICENSE](LICENSE).
