package io.kinsena.web

import io.kinsena.domain.CycleItem
import io.kinsena.domain.CycleSummary
import kotlinx.html.*
import java.text.DecimalFormat

object Views {
    private val moneyFmt = DecimalFormat("#,##0.00")

    fun HTML.layout(pageTitle: String, block: MAIN.() -> Unit) {
        head {
            meta(charset = "utf-8")
            meta(name = "viewport", content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")
            meta(name = "apple-mobile-web-app-capable", content = "yes")
            meta(name = "apple-mobile-web-app-status-bar-style", content = "black-translucent")
            title { +pageTitle }
            // Lightweight clean CSS (modern dark/light responsive)
            link(rel = "stylesheet", href = "https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css")
            // HTMX for zero-refresh swaps
            script(src = "https://unpkg.com/htmx.org@2.0.3") {}
            style {
                unsafe {
                    +"""
                    :root { --pico-font-size: 16px; }
                    body { max-width: 650px; margin: 0 auto; padding: 12px 16px; background-color: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                    .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
                    .brand { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.05em; color: #38bdf8; margin: 0; }
                    .tagline { font-size: 0.75rem; color: #94a3b8; margin: 0; }
                    .stat-card { background: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #334155; }
                    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; }
                    .stat-val { font-size: 1.25rem; font-weight: 700; color: #f1f5f9; display: block; }
                    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
                    .remaining-val { color: #f43f5e; }
                    .paid-val { color: #10b981; }
                    .bill-row { display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 12px 14px; margin-bottom: 8px; border-radius: 10px; border: 1px solid #334155; transition: all 0.15s ease; }
                    .bill-row.done { opacity: 0.45; background: #0f172a; border-color: #1e293b; }
                    .bill-left { display: flex; align-items: center; gap: 12px; flex: 1; }
                    .bill-title { font-weight: 600; font-size: 1rem; color: #f8fafc; }
                    .bill-row.done .bill-title { text-decoration: line-through; color: #94a3b8; }
                    .bill-amount-input { width: 130px; text-align: right; background: #0f172a; border: 1px solid #475569; color: #38bdf8; font-weight: 600; padding: 6px 8px; border-radius: 6px; font-size: 0.95rem; margin: 0; }
                    .check-btn { width: 36px; height: 36px; border-radius: 8px; border: 2px solid #64748b; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #10b981; padding: 0; }
                    .check-btn.checked { border-color: #10b981; background: #064e3b; }
                    .nav-links { display: flex; gap: 12px; font-size: 0.85rem; }
                    .nav-links a { color: #94a3b8; text-decoration: none; }
                    .nav-links a.active { color: #38bdf8; font-weight: 600; }
                    .add-box { display: flex; gap: 8px; margin-top: 16px; margin-bottom: 24px; }
                    .add-box input { margin: 0; }
                    """
                }
            }
        }
        body {
            header {
                div("header-bar") {
                    div {
                        h1("brand") { +"kinsena" }
                        p("tagline") { +"payday rhythm · obligations · zero fluff" }
                    }
                    div("nav-links") {
                        a(href = "/") { +"Active" }
                        a(href = "/history") { +"History" }
                        a(href = "/templates") { +"Defaults" }
                    }
                }
            }
            main {
                block()
            }
        }
    }

    fun MAIN.renderActive(summary: CycleSummary?) {
        if (summary == null) {
            article {
                h3 { +"No active payday cycle" }
                p { +"Start a new cycle to load your default obligations and track payments." }
                form(action = "/cycles/new", method = FormMethod.post) {
                    div(classes = "grid") {
                        input(type = InputType.text, name = "title") {
                            placeholder = "e.g. October 15 or Month-End"
                            required = true
                        }
                        select {
                            name = "cadence"
                            option { value = "ANY"; +"All Templates" }
                            option { value = "MID_MONTH"; +"15th Cycle (Mid-Month)" }
                            option { value = "MONTH_END"; +"30th Cycle (Month-End)" }
                        }
                    }
                    button(type = ButtonType.submit) { +"Start Cycle" }
                }
            }
            return
        }

        // Summary Card
        div("stat-card") {
            div("stat-grid") {
                div {
                    span("stat-val") { +"₱${moneyFmt.format(summary.totalAmount)}" }
                    span("stat-label") { +"Total Obligation" }
                }
                div {
                    span("stat-val paid-val") { +"₱${moneyFmt.format(summary.paidAmount)}" }
                    span("stat-label") { +"${summary.doneCount} Paid" }
                }
                div {
                    span("stat-val remaining-val") { +"₱${moneyFmt.format(summary.remainingAmount)}" }
                    span("stat-label") { +"${summary.pendingCount} Remaining" }
                }
            }
        }

        // Active Cycle Header
        div {
            style = "display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;"
            h2 {
                style = "margin: 0; font-size: 1.25rem;"
                +summary.cycle.title
            }
            form(action = "/cycles/${summary.cycle.id}/close", method = FormMethod.post) {
                style = "margin: 0;"
                button {
                    style = "padding: 4px 10px; font-size: 0.75rem; background: #334155; border: none;"
                    +"Finish Cycle"
                }
            }
        }

        // Bill Checklist items container (swapped via HTMX)
        div {
            id = "items-list"
            summary.items.forEach { item ->
                renderBillItem(item)
            }
        }

        // Quick add an extra payee
        form(action = "/cycles/${summary.cycle.id}/add-item", method = FormMethod.post, classes = "add-box") {
            input(type = InputType.text, name = "name") {
                placeholder = "Add payee (e.g. Lazada or Kyle)"
                required = true
                style = "flex: 2;"
            }
            input(type = InputType.text, name = "amountExpr") {
                placeholder = "Amount or 1000 + 500"
                style = "flex: 1;"
            }
            button(type = ButtonType.submit) {
                style = "width: auto; padding: 0 16px;"
                +"+"
            }
        }
    }

    fun FlowContent.renderBillItem(item: CycleItem) {
        val rowClass = if (item.isDone) "bill-row done" else "bill-row"
        val checkClass = if (item.isDone) "check-btn checked" else "check-btn"

        div(rowClass) {
            id = "bill-item-${item.id}"

            div("bill-left") {
                button(classes = checkClass) {
                    attributes["hx-post"] = "/items/${item.id}/toggle"
                    attributes["hx-target"] = "#items-list"
                    attributes["hx-swap"] = "innerHTML"
                    if (item.isDone) +"✓" else +""
                }
                div {
                    span("bill-title") { +item.name }
                }
            }

            div {
                style = "display: flex; align-items: center; gap: 8px;"
                input(type = InputType.text, classes = "bill-amount-input") {
                    value = item.amountExpr?.ifBlank { moneyFmt.format(item.amount) } ?: moneyFmt.format(item.amount)
                    attributes["hx-post"] = "/items/${item.id}/amount"
                    attributes["hx-trigger"] = "change"
                    attributes["hx-target"] = "#items-list"
                    attributes["hx-swap"] = "innerHTML"
                    attributes["name"] = "amountExpr"
                }
                a(href = "#") {
                    style = "color: #64748b; font-size: 0.9rem; text-decoration: none;"
                    attributes["hx-delete"] = "/items/${item.id}"
                    attributes["hx-target"] = "#items-list"
                    attributes["hx-swap"] = "innerHTML"
                    +"×"
                }
            }
        }
    }

    fun MAIN.renderHistory(history: List<CycleSummary>) {
        h2 { +"Settled Cycles" }
        if (history.isEmpty()) {
            p { +"No past cycles saved yet." }
            return
        }

        history.forEach { summary ->
            article {
                div {
                    style = "display: flex; justify-content: space-between; align-items: center;"
                    h4 { +summary.cycle.title }
                    span {
                        style = "font-weight: 700; color: #38bdf8;"
                        +"₱${moneyFmt.format(summary.totalAmount)}"
                    }
                }
                p {
                    style = "font-size: 0.8rem; color: #94a3b8; margin: 0 0 12px 0;"
                    +"Recorded: ${summary.cycle.date} · ${summary.doneCount} of ${summary.items.size} cleared"
                }
                details {
                    summary { +"View details" }
                    ul {
                        summary.items.forEach { item ->
                            li {
                                if (item.isDone) +"✓ " else +"○ "
                                +"${item.name} — ₱${moneyFmt.format(item.amount)}"
                            }
                        }
                    }
                }
            }
        }
    }

    fun MAIN.renderTemplates(templates: List<io.kinsena.domain.TemplateItem>) {
        h2 { +"Default Obligations" }
        p { +"These automatically populate whenever you create a new cycle." }

        form(action = "/templates/new", method = FormMethod.post, classes = "add-box") {
            input(type = InputType.text, name = "name") {
                placeholder = "Payee Name (e.g. DCTV)"
                required = true
                style = "flex: 2;"
            }
            input(type = InputType.number, name = "defaultAmount") {
                placeholder = "Fixed Amount (optional)"
                step = "0.01"
                style = "flex: 1;"
            }
            select {
                name = "cadence"
                style = "flex: 1;"
                option { value = "ANY"; +"Any" }
                option { value = "MID_MONTH"; +"15th" }
                option { value = "MONTH_END"; +"30th" }
            }
            button(type = ButtonType.submit) {
                style = "width: auto; padding: 0 16px;"
                +"Save"
            }
        }

        table {
            thead {
                tr {
                    th { +"Payee" }
                    th { +"Default Amount" }
                    th { +"Cadence" }
                }
            }
            tbody {
                templates.forEach { tmpl ->
                    tr {
                        td { +tmpl.name }
                        td { +(tmpl.defaultAmount?.let { "₱${moneyFmt.format(it)}" } ?: "Variable") }
                        td { +tmpl.cadence.name }
                    }
                }
            }
        }
    }
}
