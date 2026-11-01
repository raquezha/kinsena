# kinsena

A minimal, self-hosted payday checklist for recurring obligations and revolving statements.

Zero heavy accounting concepts. Designed around the bi-monthly payday rhythm (15th / month-end).

## Features
- **Payday Batches:** Start a cycle (15th or Month-End), preloaded with your standard obligations.
- **Auto Math Evaluation:** Type `10538.91 + 3403` directly into amount fields—it evaluates automatically.
- **Tap to Clear:** Strike through items as you pay them in your banking apps.
- **Live Stats:** See remaining cash needed before salary runs dry.
- **History:** Keep past settled cycles without manual copy-pasting.
- **Single-File SQLite:** All data lives in `data/kinsena.db`. Backup is just copying one file.
- **Fast:** Instant load on mobile Safari/Firefox/Chrome (< 50ms) using Ktor + HTMX.

## Getting Started

### Prerequisites
- JDK 17+ or JDK 21+

### Running Locally
```bash
./gradlew run
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Docker Deployment
```bash
docker build -t kinsena .
docker run -d -p 8080:8080 -v $(pwd)/data:/app/data kinsena
```

## Tech Stack
- **Backend:** Kotlin + Ktor Server
- **Database:** SQLite + Exposed
- **Frontend:** Kotlin HTML DSL + HTMX (zero npm build step)
- **CSS:** Pico.css

## License
MIT
