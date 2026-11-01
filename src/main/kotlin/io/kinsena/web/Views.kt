package io.kinsena.web

import io.kinsena.domain.CycleItem
import io.kinsena.domain.CycleSummary
import kotlinx.html.*
import java.text.DecimalFormat

object Views {
    private val moneyFmt get() = DecimalFormat("#,##0.00")

    fun HTML.layout(pageTitle: String, signedIn: Boolean = true, block: MAIN.() -> Unit) {
        head {
            meta(charset = "utf-8")
            meta(name = "viewport", content = "width=device-width, initial-scale=1")
            meta(name = "apple-mobile-web-app-capable", content = "yes")
            meta(name = "apple-mobile-web-app-status-bar-style", content = "black-translucent")
            title { +pageTitle }
            link(rel = "manifest", href = "/manifest.webmanifest")
            link(rel = "apple-touch-icon", href = "/icon-192.png")
            meta(name = "theme-color", content = "#0f172a")
            style {
                unsafe {
                    +"""
                    * { box-sizing: border-box; }
                    body { max-width: 650px; margin: 0 auto; padding: 12px 16px; background-color: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                    a { color: #38bdf8; } input, select, button { font: inherit; border-radius: 8px; padding: 8px; }
                    input, select { background: #0f172a; color: #f8fafc; border: 1px solid #475569; min-width: 0; }
                    button { background: #0369a1; border: 0; color: #fff; cursor: pointer; }
                    article { background: #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0; }
                    form { margin: 0; } .grid { display: grid; gap: 8px; margin-bottom: 8px; }
                    .login-form { display: grid; gap: 16px; }
                    .login-form label { display: grid; gap: 8px; }
                    .login-form input, .login-form button { width: 100%; min-height: 44px; }
                    .inline-form { display: flex; gap: 6px; align-items: center; }
                    .bill-row button { min-width: 44px; min-height: 44px; }
                    :focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
                    .notice { border: 1px solid #fbbf24; border-radius: 8px; padding: 10px; color: #fde68a; }
                    .error { color: #fda4af; }
                    @media (max-width: 600px) { body { max-width: 390px; margin-left: 0; } .header-bar .nav-links { width: 100%; } .bill-row { flex-wrap: wrap; gap: 8px; } .bill-left { flex-basis: 100%; } .bill-row > .inline-form { width: 100%; } .bill-amount-input { width: 120px !important; } .add-box { flex-wrap: wrap; } .stat-val { font-size: 1rem !important; } }
                    .header-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
                    .brand { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.05em; color: #38bdf8; margin: 0; }
                    .tagline { font-size: 0.75rem; color: #94a3b8; margin: 0; }
                    .stat-card { background: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #334155; }
                    .stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; text-align: center; }
                    .stat-val { font-size: 1.25rem; font-weight: 700; color: #f1f5f9; display: block; overflow-wrap: anywhere; }
                    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
                    .remaining-val { color: #f43f5e; }
                    .paid-val { color: #10b981; }
                    .bill-row { display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 12px 14px; margin-bottom: 8px; border-radius: 10px; border: 1px solid #334155; transition: all 0.15s ease; }
                    .bill-row.done { opacity: 0.8; background: #0f172a; border-color: #1e293b; }
                    .bill-left { display: flex; align-items: center; gap: 12px; flex: 1; }
                    .bill-title { font-weight: 600; font-size: 1rem; color: #f8fafc; }
                    .bill-row.done .bill-title { text-decoration: line-through; color: #94a3b8; }
                    .bill-amount-input { width: 130px; text-align: right; background: #0f172a; border: 1px solid #475569; color: #38bdf8; font-weight: 600; padding: 6px 8px; border-radius: 6px; font-size: 0.95rem; margin: 0; }
                    .check-btn { width: 44px; height: 44px; border-radius: 8px; border: 2px solid #64748b; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #10b981; padding: 0; }
                    .check-btn.checked { border-color: #10b981; background: #064e3b; }
                    .nav-links { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 0.85rem; }
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
                    if (signedIn) div("nav-links") {
                        a(href = "/") { +"Active" }
                        a(href = "/history") { +"History" }
                        a(href = "/templates") { +"Defaults" }
                        form(action = "/logout", method = FormMethod.post) {
                            button(type = ButtonType.submit) { +"Log out" }
                        }
                    }
                }
            }
            main {
                block()
            }
        }
    }

    fun MAIN.renderLogin(invalid: Boolean = false) {
        article {
            h2 { +"Sign in" }
            if (invalid) p("error") { attributes["role"] = "alert"; +"Could not sign in. Check your passphrase or try again shortly." }
            form(action = "/login", method = FormMethod.post, classes = "login-form") {
                label {
                    +"Passphrase"
                    input(type = InputType.password, name = "password") {
                        required = true
                        attributes["autocomplete"] = "current-password"
                        attributes["autofocus"] = "autofocus"
                    }
                }
                button(type = ButtonType.submit) { +"Sign in" }
            }
        }
    }

    fun MAIN.renderActive(summary: CycleSummary?) {
        if (summary == null) {
            article {
                h3 { +"No active payday cycle" }
                p { +"Save recurring names in Defaults, then start a cycle. You can also start with an empty list." }
                p { a(href = "/templates") { +"Set up saved items" } }
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
                    span("stat-label") { +"Known Total" }
                }
                div {
                    span("stat-val paid-val") { +"₱${moneyFmt.format(summary.paidAmount)}" }
                    span("stat-label") { +"${summary.doneCount} Paid" }
                }
                div {
                    span("stat-val remaining-val") { +"₱${moneyFmt.format(summary.remainingAmount)}" }
                    span("stat-label") { +"${summary.pendingCount} Unpaid (known)" }
                }
            }
            if (summary.missingCount > 0) p("notice") { attributes["role"] = "status"; +"${summary.missingCount} amount(s) unknown. Totals include known amounts only." }
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
                button(type = ButtonType.submit) {
                    style = "padding: 4px 10px; font-size: 0.75rem; background: #334155; border: none;"
                    +"Finish Cycle"
                }
            }
        }

        // Bill Checklist
        div {
            id = "items-list"
            summary.items.forEach { item ->
                renderBillItem(item)
            }
        }

        // Quick add an extra payee
        form(action = "/cycles/${summary.cycle.id}/add-item", method = FormMethod.post, classes = "add-box") {
            input(type = InputType.text, name = "name") {
                placeholder = "Add item"
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
                form(action = "/items/${item.id}/toggle", method = FormMethod.post) {
                    button(type = ButtonType.submit, classes = checkClass) {
                        attributes["aria-label"] = if (item.isDone) "Mark ${item.name} unpaid" else "Mark ${item.name} paid"
                        if (item.isDone) +"✓" else +"○"
                    }
                }
                div {
                    span("bill-title") { +item.name }
                }
            }

            div("inline-form") {
                form(action = "/items/${item.id}/amount", method = FormMethod.post, classes = "inline-form") {
                    input(type = InputType.text, classes = "bill-amount-input", name = "amountExpr") {
                        value = item.amountExpr ?: ""
                        placeholder = "Unknown"
                        attributes["aria-label"] = "Amount for ${item.name}"
                        attributes["inputmode"] = "decimal"
                        attributes["maxlength"] = "256"
                    }
                    button(type = ButtonType.submit) { attributes["aria-label"] = "Save amount for ${item.name}"; +"Save" }
                }
                form(action = "/items/${item.id}/delete", method = FormMethod.post) {
                    attributes["onsubmit"] = "return confirm('Remove this item from this cycle?')"
                    button(type = ButtonType.submit) { attributes["aria-label"] = "Remove ${item.name}"; +"×" }
                }
            }
        }
    }

    fun MAIN.renderHistory(history: List<CycleSummary>, canReopen: Boolean) {
        h2 { +"Settled Cycles" }
        if (history.isEmpty()) {
            p { +"No past cycles saved yet." }
            return
        }

        history.forEachIndexed { index, summary ->
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
                if (index == 0 && canReopen) {
                    form(action = "/cycles/${summary.cycle.id}/reopen", method = FormMethod.post) {
                        button(type = ButtonType.submit) { +"Reopen this cycle" }
                    }
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
        h2 { +"Saved items" }
        p { +"Add the names you want to reuse. New cycles start with these items; amounts can stay blank." }

        form(action = "/templates/new", method = FormMethod.post, classes = "add-box") {
            input(type = InputType.text, name = "name") {
                placeholder = "Item name"
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

        templates.forEach { tmpl ->
            div("bill-row") {
                div {
                    strong { +tmpl.name }
                    small { +" · ${tmpl.cadence.name.replace('_', ' ').lowercase()}" }
                }
                div("inline-form") {
                    form(action = "/templates/${tmpl.id}/amount", method = FormMethod.post, classes = "inline-form") {
                        input(type = InputType.text, name = "defaultAmount", classes = "bill-amount-input") {
                            value = tmpl.defaultAmount?.toString() ?: ""
                            placeholder = "Varies"
                            attributes["aria-label"] = "Default amount for ${tmpl.name}"
                            attributes["inputmode"] = "decimal"
                        }
                        button(type = ButtonType.submit) { +"Save" }
                    }
                    form(action = "/templates/${tmpl.id}/archive", method = FormMethod.post) {
                        attributes["onsubmit"] = "return confirm('Remove this saved item from future cycles?')"
                        button(type = ButtonType.submit) { attributes["aria-label"] = "Remove ${tmpl.name}"; +"×" }
                    }
                }
            }
        }
    }
}
