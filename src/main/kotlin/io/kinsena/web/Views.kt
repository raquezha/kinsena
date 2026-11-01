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
            meta(name = "theme-color", content = "#0b0d0e")
            style {
                unsafe {
                    +"""
                    * { box-sizing: border-box; }
                    body { max-width: 650px; margin: 0 auto; padding: 20px 16px; background: #0b0d0e; color: #f2f3f1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                    a { color: #b5d8c1; } input, select, button { font: inherit; border-radius: 10px; padding: 8px; }
                    input, select { background: #111416; color: #f2f3f1; border: 1px solid #414749; min-width: 0; }
                    button { background: #b5d8c1; border: 0; color: #101512; font-weight: 600; cursor: pointer; }
                    article { background: #191c1e; border: 1px solid #303638; border-radius: 18px; padding: 20px; margin: 16px 0; }
                    form { margin: 0; } .grid { display: grid; gap: 8px; margin-bottom: 8px; }
                    .login-form { display: grid; gap: 16px; }
                    .login-form label { display: grid; gap: 8px; }
                    .login-form input, .login-form button { width: 100%; min-height: 44px; }
                    .inline-form { display: flex; gap: 6px; align-items: center; }
                    .bill-row button { min-width: 44px; min-height: 44px; }
                    :focus-visible { outline: 2px solid #b5d8c1; outline-offset: 2px; }
                    .notice { border: 1px solid #866f42; border-radius: 10px; padding: 10px; color: #f1d59a; font-size: 0.85rem; margin: 16px 0 0; }
                    .error { color: #f3aaa4; }
                    @media (max-width: 600px) { body { max-width: 390px; margin-left: 0; } .header-bar .nav-links { width: 100%; } .bill-row { flex-wrap: wrap; gap: 8px; } .bill-left { flex-basis: 100%; } .bill-row > .inline-form { width: 100%; } .bill-amount-input { width: 120px !important; } .add-box { flex-wrap: wrap; } .stat-val { font-size: 1rem !important; } }
                    .header-bar { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; padding-bottom: 18px; margin-bottom: 20px; }
                    .brand { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.05em; color: #f2f3f1; margin: 0; }
                    .tagline { font-size: 0.75rem; color: #9da5a2; margin: 0; }
                    .wallet-card { background: linear-gradient(145deg, #303634, #1b201e 65%, #151918); border: 1px solid #4b5952; border-radius: 22px; padding: 24px; margin-bottom: 28px; box-shadow: 0 16px 35px #0006; }
                    .wallet-top, .wallet-footer, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
                    .wallet-top { color: #c4cec7; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; }
                    .wallet-top strong { color: #f2f3f1; letter-spacing: 0; text-transform: none; font-size: 0.9rem; }
                    .wallet-balance { margin: 30px 0 24px; }
                    .wallet-balance span, .wallet-footer span { display: block; color: #c4cec7; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
                    .wallet-balance strong { display: block; font-size: clamp(2rem, 8vw, 2.75rem); letter-spacing: -0.05em; font-weight: 700; overflow-wrap: anywhere; }
                    .wallet-footer { border-top: 1px solid #5b686055; padding-top: 16px; }
                    .wallet-footer strong { display: block; font-size: 1rem; margin-top: 3px; }
                    .wallet-footer div:last-child { text-align: right; }
                    .section-heading { margin-bottom: 14px; }
                    .section-heading h2 { margin: 0; font-size: 1.2rem; }
                    .section-heading button { background: transparent; border: 1px solid #48504d; color: #ced5d0; font-size: 0.8rem; }
                    .bill-row { display: flex; align-items: center; justify-content: space-between; background: #191c1e; padding: 12px 14px; margin-bottom: 8px; border-radius: 14px; border: 1px solid #303638; }
                    .bill-row.done { background: #111416; border-color: #272d2a; }
                    .bill-left { display: flex; align-items: center; gap: 12px; flex: 1; }
                    .bill-title { font-weight: 600; font-size: 1rem; color: #f2f3f1; }
                    .bill-row.done .bill-title { text-decoration: line-through; color: #a5afaa; }
                    .bill-amount-input { width: 130px; text-align: right; background: #111416; border: 1px solid #414749; color: #f2f3f1; font-weight: 600; padding: 6px 8px; border-radius: 8px; font-size: 0.95rem; margin: 0; }
                    .check-btn { width: 44px; height: 44px; border-radius: 12px; border: 1px solid #626c66; background: transparent; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #b5d8c1; padding: 0; }
                    .check-btn.checked { border-color: #668772; background: #263d30; }
                    .nav-links { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 0.85rem; }
                    .nav-links a { color: #c4cec7; text-decoration: none; }
                    .nav-links a:hover { color: #f2f3f1; }
                    .nav-links button { background: transparent; color: #c4cec7; padding: 6px; font-weight: 400; }
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

        div("wallet-card") {
            div("wallet-top") {
                span { +"Kinsena" }
                strong { +summary.cycle.title }
            }
            div("wallet-balance") {
                span { +"Known remaining" }
                strong { +"₱${moneyFmt.format(summary.remainingAmount)}" }
            }
            div("wallet-footer") {
                div {
                    span { +"Known total" }
                    strong { +"₱${moneyFmt.format(summary.totalAmount)}" }
                }
                div {
                    span { +"Paid" }
                    strong { +"${summary.doneCount} of ${summary.items.size}" }
                }
            }
            if (summary.missingCount > 0) p("notice") { attributes["role"] = "status"; +"${summary.missingCount} amount(s) unknown. Totals include known amounts only." }
        }

        div("section-heading") {
            h2 { +"To pay" }
            form(action = "/cycles/${summary.cycle.id}/close", method = FormMethod.post) {
                button(type = ButtonType.submit) { +"Finish cycle" }
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
                        style = "font-weight: 700; color: #b5d8c1;"
                        +"₱${moneyFmt.format(summary.totalAmount)}"
                    }
                }
                p {
                    style = "font-size: 0.8rem; color: #a5afaa; margin: 0 0 12px 0;"
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
