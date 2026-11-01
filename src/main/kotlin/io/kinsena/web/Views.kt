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
                    body { max-width: 650px; margin: 0 auto; padding: 20px 16px; background: #0b0d0e; color: #f2f3f1; font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                    a { color: #b5d8c1; } input, select, button { font: inherit; border-radius: 12px; padding: 8px 16px; min-height: 48px; }
                    input, select { background: #111416; color: #f2f3f1; border: 1px solid #414749; min-width: 0; }
                    button { background: #b5d8c1; border: 0; color: #101512; font-weight: 600; cursor: pointer; }
                    button:hover { filter: brightness(1.09); }
                    button img, summary img { display: block; width: 20px; height: 20px; }
                    article { background: #191c1e; border: 1px solid #303638; border-radius: 18px; padding: 20px; margin: 16px 0; }
                    form { margin: 0; } .grid { display: grid; gap: 12px; margin-bottom: 16px; }
                    .login-form { display: grid; gap: 16px; }
                    .login-form label { display: grid; gap: 8px; }
                    .login-form input, .login-form button { width: 100%; }
                    .inline-form { display: flex; gap: 8px; align-items: center; }
                    .button-quiet { background: transparent; border: 1px solid #414749; color: #d4dad6; }
                    .icon-button { display: grid; place-items: center; width: 48px; padding: 0; flex: none; }
                    :focus-visible { outline: 2px solid #b5d8c1; outline-offset: 2px; }
                    .notice { border: 1px solid #866f42; border-radius: 10px; padding: 10px; color: #f1d59a; font-size: 0.85rem; margin: 16px 0 0; }
                    .error { color: #f3aaa4; }
                    @media (max-width: 600px) { body { max-width: 390px; margin-left: 0; } .header-bar .nav-links { width: 100%; } .add-box { flex-wrap: wrap; } .add-box input[name="name"] { flex-basis: 100% !important; } .wallet-top { flex-wrap: wrap; } .saved-row { flex-wrap: wrap; } .saved-row .inline-form { width: 100%; } }
                    .header-bar { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; padding-bottom: 18px; margin-bottom: 20px; }
                    .brand { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.05em; color: #f2f3f1; margin: 0; }
                    .tagline { font-size: 0.875rem; color: #aab4ad; margin: 0; }
                    .wallet-card { background: linear-gradient(145deg, #303634, #1b201e 65%, #151918); border: 1px solid #4b5952; border-radius: 22px; padding: 24px; margin-bottom: 28px; box-shadow: 0 16px 35px #0006; }
                    .wallet-top, .wallet-footer, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
                    .wallet-top { color: #c4cec7; font-size: 0.875rem; letter-spacing: 0.05em; text-transform: uppercase; }
                    .wallet-top strong { color: #f2f3f1; letter-spacing: 0; text-transform: none; font-size: 0.9rem; }
                    .wallet-balance { margin: 30px 0 24px; }
                    .wallet-balance span, .wallet-footer span { display: block; color: #c4cec7; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.04em; }
                    .wallet-balance strong { display: block; font-size: clamp(2rem, 8vw, 2.75rem); letter-spacing: -0.05em; font-weight: 700; overflow-wrap: anywhere; }
                    .wallet-footer { border-top: 1px solid #5b686055; padding-top: 16px; }
                    .wallet-footer strong { display: block; font-size: 1rem; margin-top: 3px; }
                    .wallet-footer div:last-child { text-align: right; }
                    .section-heading { margin-bottom: 16px; }
                    .section-heading h2 { margin: 0; font-size: 1.25rem; }
                    .section-heading button { background: transparent; border: 1px solid #48504d; color: #ced5d0; font-size: 0.875rem; min-height: 48px; }
                    .bill-row { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 12px; align-items: start; background: #191c1e; padding: 12px; margin-bottom: 8px; border-radius: 16px; border: 1px solid #303638; }
                    .bill-row.done { background: #111416; border-color: #272d2a; }
                    .bill-details { min-width: 0; }
                    .bill-details summary { list-style: none; display: flex; align-items: center; gap: 8px; min-height: 48px; cursor: pointer; }
                    .bill-details summary::-webkit-details-marker { display: none; }
                    .bill-title { flex: 1; min-width: 0; overflow-wrap: anywhere; font-weight: 600; color: #f2f3f1; }
                    .bill-row.done .bill-title { text-decoration: line-through; color: #a5afaa; }
                    .bill-amount { color: #d7dfd9; font-variant-numeric: tabular-nums; white-space: nowrap; font-size: 0.875rem; }
                    .bill-amount.unknown { color: #f1d59a; }
                    .bill-editor { display: grid; gap: 12px; padding: 16px 0 4px; border-top: 1px solid #303638; margin-top: 8px; }
                    .amount-form { display: flex; gap: 8px; }
                    .amount-form input { flex: 1; width: 100%; text-align: right; font-variant-numeric: tabular-nums; }
                    .remove-form { justify-self: end; }
                    .remove-form button { background: transparent; color: #d4dad6; min-height: 48px; }
                    .bill-amount-input { width: 130px; text-align: right; background: #111416; border: 1px solid #414749; color: #f2f3f1; font-weight: 600; font-variant-numeric: tabular-nums; margin: 0; }
                    .check-btn { width: 48px; height: 48px; border-radius: 50%; border: 1px solid #78837b; background: transparent; padding: 0; display: grid; place-items: center; }
                    .check-btn.checked { border-color: #b5d8c1; background: #b5d8c1; }
                    .nav-links { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.875rem; }
                    .nav-links a { display: inline-flex; align-items: center; min-height: 48px; padding: 0 8px; color: #c4cec7; text-decoration: none; }
                    .nav-links a:hover { color: #f2f3f1; }
                    .nav-links button { background: transparent; color: #c4cec7; padding: 0 8px; font-weight: 400; }
                    .add-box { display: flex; gap: 8px; margin-top: 24px; margin-bottom: 24px; }
                    .add-box input { margin: 0; }
                    .saved-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px; margin-bottom: 8px; background: #191c1e; border: 1px solid #303638; border-radius: 16px; }
                    .saved-row small { display: block; color: #aab4ad; font-size: 0.875rem; }
                    .saved-row .inline-form input { width: 116px; }
                    .saved-row .inline-form .button-quiet { padding: 0 12px; }
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
                attributes["aria-label"] = "New item name"
                style = "flex: 2;"
            }
            input(type = InputType.text, name = "amountExpr") {
                placeholder = "Amount (optional)"
                attributes["aria-label"] = "New item amount"
                attributes["inputmode"] = "decimal"
                style = "flex: 1;"
            }
            button(type = ButtonType.submit, classes = "icon-button") {
                attributes["aria-label"] = "Add item"
                img(src = "/icons/plus.svg", alt = "")
            }
        }
    }

    fun FlowContent.renderBillItem(item: CycleItem) {
        div(if (item.isDone) "bill-row done" else "bill-row") {
            id = "bill-item-${item.id}"
            form(action = "/items/${item.id}/toggle", method = FormMethod.post) {
                button(type = ButtonType.submit, classes = if (item.isDone) "check-btn checked" else "check-btn") {
                    attributes["aria-label"] = if (item.isDone) "Mark ${item.name} unpaid" else "Mark ${item.name} paid"
                    if (item.isDone) img(src = "/icons/check.svg", alt = "")
                }
            }
            details("bill-details") {
                summary {
                    span("bill-title") { +item.name }
                    span(if (item.amountExpr.isNullOrBlank()) "bill-amount unknown" else "bill-amount") {
                        +(if (item.amountExpr.isNullOrBlank()) "Set amount" else "₱${moneyFmt.format(item.amount)}")
                    }
                    img(src = "/icons/edit.svg", alt = "")
                }
                div("bill-editor") {
                    form(action = "/items/${item.id}/amount", method = FormMethod.post, classes = "amount-form") {
                        input(type = InputType.text, name = "amountExpr") {
                            value = item.amountExpr ?: ""
                            placeholder = "Amount or 1000 + 500"
                            attributes["aria-label"] = "Amount for ${item.name}"
                            attributes["inputmode"] = "decimal"
                            attributes["maxlength"] = "256"
                        }
                        button(type = ButtonType.submit) { +"Save" }
                    }
                    form(action = "/items/${item.id}/delete", method = FormMethod.post, classes = "remove-form") {
                        attributes["onsubmit"] = "return confirm('Remove this item from this cycle?')"
                        button(type = ButtonType.submit) { +"Remove item" }
                    }
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
            div("saved-row") {
                div {
                    strong { +tmpl.name }
                    small { +tmpl.cadence.name.replace('_', ' ').lowercase() }
                }
                div("inline-form") {
                    form(action = "/templates/${tmpl.id}/amount", method = FormMethod.post, classes = "inline-form") {
                        input(type = InputType.text, name = "defaultAmount", classes = "bill-amount-input") {
                            value = tmpl.defaultAmount?.toString() ?: ""
                            placeholder = "Varies"
                            attributes["aria-label"] = "Default amount for ${tmpl.name}"
                            attributes["inputmode"] = "decimal"
                        }
                        button(type = ButtonType.submit, classes = "button-quiet") { +"Save" }
                    }
                    form(action = "/templates/${tmpl.id}/archive", method = FormMethod.post) {
                        attributes["onsubmit"] = "return confirm('Remove this saved item from future cycles?')"
                        button(type = ButtonType.submit, classes = "button-quiet") { attributes["aria-label"] = "Remove ${tmpl.name}"; +"Remove" }
                    }
                }
            }
        }
    }
}
