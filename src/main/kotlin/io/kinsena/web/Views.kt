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
                    html { background: #121517; min-height: 100%; display: flex; justify-content: center; }
                    body { width: 100%; max-width: 414px; min-height: 100vh; margin: 0; padding: 20px 16px; background: #000000; color: #f2f3f1; font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; border-left: 1px solid #1e2428; border-right: 1px solid #1e2428; box-shadow: 0 0 50px rgba(0, 0, 0, 0.8); position: relative; }
                    @media (max-width: 414px) { body { border-left: 0; border-right: 0; box-shadow: none; } }
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
                    :focus-visible { outline: 2px solid #b5d8c1; outline-offset: 2px; }
                    .notice { color: #f1d59a; font-size: 0.875rem; margin: -4px 0 12px; }
                    .error { color: #f3aaa4; }
                    .header-bar { display: flex; gap: 8px; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                    .brand { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.05em; color: #f2f3f1; margin: 0; }
                    .brand-wrap { display: flex; align-items: center; justify-content: space-between; width: 100%; }
                    .wallet-card { position: relative; overflow: hidden; background: linear-gradient(135deg, #1b211d 0%, #0f1311 50%, #0a0d0c 100%); border: 1px solid rgba(181, 216, 193, 0.16); border-radius: 24px; padding: 22px 22px 18px; margin-bottom: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between; min-height: 215px; }
                    .wallet-card::before { content: ""; position: absolute; top: -50px; right: -50px; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(181, 216, 193, 0.09), transparent 70%); pointer-events: none; }
                    .wallet-card::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(181, 216, 193, 0.25), transparent); pointer-events: none; }
                    .wallet-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
                    .card-chip { display: flex; align-items: center; gap: 10px; }
                    .emv-chip { width: 34px; height: 27px; border-radius: 6px; background: linear-gradient(135deg, #dfc699 0%, #a2834b 100%); position: relative; border: 1px solid #faeccb; box-shadow: inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.5); display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; padding: 2.5px; box-sizing: border-box; }
                    .emv-chip span { background: linear-gradient(135deg, #fff7e6 0%, #ecc987 50%, #ab8542 100%); border: 1px solid rgba(90, 60, 20, 0.5); box-shadow: inset 0 0.5px 1px rgba(255,255,255,0.8); }
                    .emv-chip span:nth-child(1) { border-radius: 0; }
                    .emv-chip span:nth-child(2) { border-radius: 4px 0 4px 4px; }
                    .emv-chip span:nth-child(3) { border-radius: 0; }
                    .emv-chip span:nth-child(4) { border-radius: 4px 4px 0 4px; }
                    .card-network { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.05em; color: #f2f3f1; text-transform: lowercase; line-height: 1; }
                    .card-digits { font-family: ui-monospace, SFMono-Regular, "Roboto Mono", Menlo, monospace; font-size: 0.8125rem; letter-spacing: 0.22em; color: #627267; font-weight: 500; }
                    .wallet-balance { margin: 16px 0 14px; }
                    .wallet-balance .balance-label-btn { background: transparent; border: 0; padding: 0; color: #7f8e84; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
                    .wallet-balance .balance-label-btn span { text-decoration: underline dotted #7f8e84; }
                    .wallet-balance .balance-row { display: flex; align-items: baseline; gap: 4px; }
                    .wallet-balance .balance-currency { font-size: 1.5rem; font-weight: 600; color: #b5d8c1; opacity: 0.85; }
                    .wallet-balance .balance-major { font-size: clamp(2.2rem, 9vw, 2.75rem); letter-spacing: -0.05em; font-weight: 800; color: #f2f3f1; font-variant-numeric: tabular-nums; line-height: 1; }
                    .wallet-balance .balance-minor { font-size: 1.25rem; font-weight: 600; color: #8a9c91; font-variant-numeric: tabular-nums; }
                    .wallet-salary-sub { font-size: 0.75rem; color: #7f8e84; margin-top: 4px; }
                    .wallet-salary-sub strong { color: #b5d8c1; font-weight: 600; }
                    .wallet-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 12px; }
                    .wallet-footer .footer-label { display: block; color: #627267; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
                    .wallet-footer .footer-val { display: block; font-size: 0.875rem; font-weight: 600; color: #c4cec7; margin-top: 2px; font-variant-numeric: tabular-nums; }
                    .card-brand-badge { display: flex; align-items: center; }
                    .brand-circles { position: relative; width: 34px; height: 22px; }
                    .brand-circles .c1, .brand-circles .c2 { position: absolute; width: 22px; height: 22px; border-radius: 50%; top: 0; }
                    .brand-circles .c1 { left: 0; background: rgba(181, 216, 193, 0.45); }
                    .brand-circles .c2 { right: 0; background: rgba(230, 200, 140, 0.45); mix-blend-mode: screen; }
                    .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 16px 0 10px; }
                    .section-heading-left { display: flex; align-items: baseline; gap: 8px; }
                    .section-heading h2 { margin: 0; font-size: 1.25rem; }
                    .section-heading span { color: #aab4ad; font-size: 0.875rem; }
                    .bill-row { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 8px; align-items: start; background: #191c1e; padding: 8px 10px; margin-bottom: 6px; border-radius: 12px; border: 1px solid #303638; }
                    .bill-row.done { background: #111416; border-color: #272d2a; }
                    .bill-details { min-width: 0; }
                    .bill-details summary { list-style: none; display: flex; align-items: center; gap: 8px; min-height: 48px; cursor: pointer; }
                    .bill-details summary::-webkit-details-marker { display: none; }
                    .bill-title { flex: 1; min-width: 0; overflow-wrap: anywhere; font-weight: 600; color: #f2f3f1; }
                    .bill-row.done .bill-title { text-decoration: line-through; color: #a5afaa; }
                    .bill-amount { color: #d7dfd9; font-variant-numeric: tabular-nums; white-space: nowrap; font-size: 0.875rem; }
                    .bill-amount.unknown { color: #f1d59a; }
                    .bill-editor { display: grid; gap: 12px; padding: 12px 0 4px; border-top: 1px solid #303638; margin: 8px 0 0 -56px; }
                    .amount-form { display: flex; gap: 8px; }
                    .amount-form input { flex: 1; width: 100%; text-align: right; font-variant-numeric: tabular-nums; }
                    .remove-form { justify-self: start; }
                    .remove-form button { background: transparent; color: #d4dad6; min-height: 48px; }
                    .check-btn { width: 48px; height: 48px; border: 0; background: transparent; padding: 0; display: grid; place-items: center; }
                    .check-btn::before { content: ""; grid-area: 1 / 1; width: 28px; height: 28px; border: 2px solid #91a397; border-radius: 10px; transition: background 150ms ease, transform 150ms ease; }
                    .check-btn.checked::before { border-color: #b5d8c1; background: #b5d8c1; }
                    .check-btn:active::before { transform: scale(.9); }
                    .check-btn img { grid-area: 1 / 1; z-index: 1; width: 18px; height: 18px; }

                    .signed-in-main { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
                    .bottom-nav { position: fixed; z-index: 6; left: 50%; bottom: 0; transform: translateX(-50%); width: 100%; max-width: 414px; display: grid; grid-template-columns: 1fr 1fr 64px 1fr 1fr; align-items: center; padding: 4px 8px calc(4px + env(safe-area-inset-bottom)); background: #0a0d0c; border-top: 1px solid #1e2428; border-left: 1px solid #1e2428; border-right: 1px solid #1e2428; }
                    @media (max-width: 414px) { .bottom-nav { border-left: 0; border-right: 0; } }
                    .bottom-nav a { display: grid; justify-items: center; align-content: center; gap: 2px; min-height: 54px; border-radius: 12px; color: #aab4ad; font-size: 0.6875rem; text-decoration: none; }
                    .bottom-nav img { width: 20px; height: 20px; opacity: .65; }
                    .bottom-nav a:hover, .bottom-nav a[aria-current="page"] { color: #b5d8c1; background: #b5d8c11a; }
                    .bottom-nav a[aria-current="page"] img { opacity: 1; }
                    .nav-fab-wrap { display: flex; justify-content: center; align-items: center; }
                    .nav-fab-btn { width: 52px; height: 52px; border-radius: 18px; background: #b5d8c1; color: #101512; border: 0; padding: 0; display: grid; place-items: center; box-shadow: 0 -4px 16px rgba(181, 216, 193, 0.3), 0 4px 12px rgba(0,0,0,0.6); transform: translateY(-14px); cursor: pointer; transition: transform 150ms ease, box-shadow 150ms ease; }
                    .nav-fab-btn:active { transform: translateY(-11px) scale(0.94); }
                    .nav-fab-btn img { width: 24px; height: 24px; }
                    .bottom-nav a:hover, .bottom-nav a[aria-current="page"] { color: #b5d8c1; background: #b5d8c11a; }
                    .bottom-nav a[aria-current="page"] img { opacity: 1; }
                    dialog.bottom-sheet { position: fixed; inset: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; background: transparent; border: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; z-index: 100; box-sizing: border-box; }
                    dialog.bottom-sheet:not([open]) { display: none; }
                    dialog.bottom-sheet::backdrop { background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); }
                    .sheet-content { width: 100%; max-width: 414px; box-sizing: border-box; background: #161a18; border: 1px solid #2e3831; border-bottom: 0; border-radius: 28px 28px 0 0; padding: 12px 20px calc(24px + env(safe-area-inset-bottom)); box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.7); display: flex; flex-direction: column; gap: 16px; animation: slideUp 200ms cubic-bezier(0.1, 0.9, 0.2, 1); }
                    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                    .sheet-handle { width: 36px; height: 4px; background: #5a6b61; border-radius: 2px; margin: 0 auto 4px; }
                    .sheet-header { display: flex; justify-content: space-between; align-items: center; }
                    .sheet-header h2 { font-size: 1.15rem; font-weight: 700; margin: 0; color: #f2f3f1; }
                    .sheet-close { background: #262f2a; border: 0; color: #a5afaa; width: 32px; height: 32px; min-height: 32px; border-radius: 50%; padding: 0; display: grid; place-items: center; font-size: 1.25rem; line-height: 1; cursor: pointer; }
                    .sheet-form { display: flex; flex-direction: column; gap: 14px; margin: 0; }
                    .sheet-input-group { display: flex; flex-direction: column; gap: 6px; }
                    .sheet-input-group label { font-size: 0.8125rem; font-weight: 500; color: #a5afaa; text-transform: uppercase; letter-spacing: 0.05em; }
                    .amount-input-wrapper { position: relative; display: flex; align-items: center; }
                    .amount-currency { position: absolute; left: 16px; font-size: 1.25rem; font-weight: 700; color: #b5d8c1; pointer-events: none; }
                    .amount-input-wrapper input { padding-left: 36px; font-size: 1.35rem; font-weight: 700; font-variant-numeric: tabular-nums; color: #b5d8c1; }
                    .sheet-submit { margin-top: 6px; width: 100%; min-height: 52px; background: #b5d8c1; color: #101512; font-size: 1rem; font-weight: 700; border-radius: 16px; border: 0; box-shadow: 0 4px 16px rgba(181, 216, 193, 0.2); }
                    .sheet-submit:active { transform: scale(0.98); }
                    .finish-submit-btn { background: #f3aaa4; color: #1c0e0d; box-shadow: 0 4px 16px rgba(243, 170, 164, 0.2); }
                    .saved-row { padding: 8px 12px; margin-bottom: 6px; background: #191c1e; border: 1px solid #303638; border-radius: 12px; }
                    .saved-row summary { display: flex; align-items: center; gap: 12px; min-height: 48px; cursor: pointer; list-style: none; }
                    .saved-row summary::-webkit-details-marker, .add-saved summary::-webkit-details-marker { display: none; }
                    .saved-row .saved-name { flex: 1; min-width: 0; overflow-wrap: anywhere; }
                    .saved-row small { display: block; color: #aab4ad; font-size: 0.875rem; }
                    .add-saved { background: #191c1e; border: 1px solid #303638; border-radius: 12px; padding: 8px 12px; margin-bottom: 12px; }
                    .add-saved summary { min-height: 48px; display: flex; align-items: center; color: #b5d8c1; font-weight: 600; cursor: pointer; list-style: none; }
                    .add-saved .add-box { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin: 16px 0 4px; }
                    .add-saved .add-box input[name="name"], .add-saved .add-box button { grid-column: 1 / -1; width: 100%; }
                    .add-saved .add-box input, .add-saved .add-box select { width: 100%; }
                    .saved-row .bill-editor { margin-left: 0; }
                    .settings-action { width: 100%; text-align: left; background: #191c1e; color: #f2f3f1; border: 1px solid #414749; }
                    """
                }
            }
        }
        body {
            if (!signedIn || pageTitle != "kinsena · active cycle") {
                header {
                    div("header-bar") {
                        div("brand-wrap") {
                            h1("brand") { +"kinsena" }
                        }
                    }
                }
            }
            main {
                if (signedIn) attributes["class"] = "signed-in-main"
                block()
            }
            if (signedIn) nav("bottom-nav") {


                attributes["aria-label"] = "Main navigation"
                a(href = "/") {
                    if (pageTitle == "kinsena · active cycle") attributes["aria-current"] = "page"
                    img(src = "/icons/nav-active.svg", alt = "")
                    +"Active"
                }
                a(href = "/history") {
                    if (pageTitle == "kinsena · history") attributes["aria-current"] = "page"
                    img(src = "/icons/nav-history.svg", alt = "")
                    +"History"
                }
                div("nav-fab-wrap") {
                    button(type = ButtonType.button, classes = "nav-fab-btn") {
                        id = "main-nav-fab"
                        attributes["onclick"] = "document.getElementById('add-payment-dialog')?.showModal() || (window.location.href='/')"
                        attributes["aria-label"] = "Add payment"
                        img(src = "/icons/plus.svg", alt = "")
                    }
                }
                a(href = "/templates") {
                    if (pageTitle == "kinsena · defaults") attributes["aria-current"] = "page"
                    img(src = "/icons/nav-defaults.svg", alt = "")
                    +"Defaults"
                }
                a(href = "/settings") {
                    if (pageTitle == "kinsena · settings") attributes["aria-current"] = "page"
                    img(src = "/icons/nav-settings.svg", alt = "")
                    +"Settings"
                }
            }
            script {
                unsafe {
                    +"""
                    (function() {
                        var fab = document.getElementById('main-nav-fab');
                        if (!fab) return;
                        var timer = null;
                        var isLongPress = false;
                        function start() {
                            isLongPress = false;
                            timer = setTimeout(function() {
                                isLongPress = true;
                                if (navigator.vibrate) navigator.vibrate(40);
                                var actDialog = document.getElementById('cycle-actions-dialog');
                                if (actDialog) actDialog.showModal();
                            }, 500);
                        }
                        function cancel() {
                            if (timer) { clearTimeout(timer); timer = null; }
                        }
                        fab.addEventListener('touchstart', start, {passive: true});
                        fab.addEventListener('touchend', function(e) {
                            cancel();
                            if (isLongPress) { e.preventDefault(); }
                        });
                        fab.addEventListener('touchmove', cancel);
                        fab.addEventListener('mousedown', start);
                        fab.addEventListener('mouseup', function(e) {
                            cancel();
                            if (isLongPress) { e.preventDefault(); }
                        });
                        fab.addEventListener('mouseleave', cancel);
                        fab.addEventListener('contextmenu', function(e) {
                            e.preventDefault();
                            var actDialog = document.getElementById('cycle-actions-dialog');
                            if (actDialog) actDialog.showModal();
                        });
                    })();
                    """
                }
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
                        div("amount-input-wrapper") {
                            span("amount-currency") { +"₱" }
                            input(type = InputType.text, name = "salary") {
                                placeholder = "Incoming Salary (optional)"
                                attributes["inputmode"] = "decimal"
                            }
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
                div("card-chip") {
                    div("emv-chip") {
                        span { }
                        span { }
                        span { }
                        span { }
                    }
                    span("card-network") { +"kinsena" }
                }
                span("card-digits") {
                    val cycleDigits = summary.cycle.title.filter { it.isDigit() }.takeLast(4).ifEmpty { "1530" }
                    +"•••• $cycleDigits"
                }
            }
            div("wallet-balance") {
                button(type = ButtonType.button, classes = "balance-label-btn") {
                    attributes["onclick"] = "document.getElementById('salary-dialog').showModal()"
                    if (summary.salaryAmount != null) {
                        span { +"Net Left · Salary ₱${moneyFmt.format(summary.salaryAmount)}" }
                    } else {
                        span { +"Remaining · ${summary.cycle.title} (tap to add salary)" }
                    }
                }
                div("balance-row") {
                    span("balance-currency") { +"₱" }
                    val displayAmount = summary.netRemaining ?: summary.remainingAmount
                    val formatted = moneyFmt.format(displayAmount)
                    val parts = formatted.split(".")
                    span("balance-major") { +parts[0] }
                    if (parts.size > 1) {
                        span("balance-minor") { +".${parts[1]}" }
                    }
                }
                if (summary.salaryAmount != null) {
                    div("wallet-salary-sub") {
                        +"Obligations: "
                        strong { +"₱${moneyFmt.format(summary.remainingAmount)}" }
                        +" of ₱${moneyFmt.format(summary.totalAmount)}"
                    }
                }
            }
            div("wallet-footer") {
                div {
                    span("footer-label") { +"Cycle Target" }
                    span("footer-val") { +"₱${moneyFmt.format(summary.totalAmount)}" }
                }
                div {
                    span("footer-label") { +"Cleared" }
                    span("footer-val") { +"${summary.doneCount} of ${summary.items.size} Paid" }
                }
                div("card-brand-badge") {
                    div("brand-circles") {
                        div("c1") { }
                        div("c2") { }
                    }
                }
            }
        }
        if (summary.missingCount > 0) p("notice") {
            attributes["role"] = "status"
            +"${summary.missingCount} ${if (summary.missingCount == 1) "amount" else "amounts"} missing; totals exclude ${if (summary.missingCount == 1) "it" else "them"}."
        }

        div("section-heading") {
            div("section-heading-left") {
                h2 { +"To pay" }
                span { +"${summary.pendingCount} left" }
            }
        }

        // Bill Checklist
        div {
            id = "items-list"
            summary.items.forEach { item ->
                renderBillItem(item)
            }
        }

        // Salary edit modal
        dialog("bottom-sheet") {
            id = "salary-dialog"
            attributes["aria-labelledby"] = "salary-title"
            attributes["onclick"] = "if (event.target === this) this.close()"
            div("sheet-content") {
                div("sheet-handle") { }
                div("sheet-header") {
                    h2 { id = "salary-title"; +"Incoming Salary" }
                    button(type = ButtonType.button, classes = "sheet-close") {
                        attributes["onclick"] = "document.getElementById('salary-dialog').close()"
                        attributes["aria-label"] = "Close"
                        +"×"
                    }
                }
                form(action = "/cycles/${summary.cycle.id}/salary", method = FormMethod.post, classes = "sheet-form") {
                    div("sheet-input-group") {
                        label {
                            attributes["for"] = "sheet-salary-amount"
                            +"Salary for this 15th/30th cutoff"
                        }
                        div("amount-input-wrapper") {
                            span("amount-currency") { +"₱" }
                            input(type = InputType.text, name = "salary") {
                                id = "sheet-salary-amount"
                                value = summary.cycle.salary?.let { moneyFmt.format(it) } ?: ""
                                placeholder = "50,000.00"
                                attributes["inputmode"] = "decimal"
                            }
                        }
                    }
                    button(type = ButtonType.submit, classes = "sheet-submit") {
                        +"Update Salary"
                    }
                }
            }
        }

        
        // Cycle Action / Finish Bottom Sheet triggered by long press on +
        dialog("bottom-sheet") {
            id = "cycle-actions-dialog"
            attributes["aria-labelledby"] = "cycle-actions-title"
            attributes["onclick"] = "if (event.target === this) this.close()"
            div("sheet-content") {
                div("sheet-handle") { }
                div("sheet-header") {
                    h2 { id = "cycle-actions-title"; +"Payday Actions" }
                    button(type = ButtonType.button, classes = "sheet-close") {
                        attributes["onclick"] = "document.getElementById('cycle-actions-dialog').close()"
                        attributes["aria-label"] = "Close"
                        +"×"
                    }
                }
                form(action = "/cycles/${summary.cycle.id}/close", method = FormMethod.post, classes = "sheet-form") {
                    if (summary.pendingCount > 0) attributes["onsubmit"] = "return confirm('Some items are still unpaid. Finish this cycle?')"
                    p {
                        style = "color: #a5afaa; margin: 0 0 12px; font-size: 0.9375rem;"
                        +"Finish this payday cycle and archive it into history."
                    }
                    button(type = ButtonType.submit, classes = "sheet-submit finish-submit-btn") {
                        +"Finish Payday Cycle"
                    }
                }
            }
        }

        dialog("bottom-sheet") {
            id = "add-payment-dialog"
            attributes["aria-labelledby"] = "add-payment-title"
            attributes["onclick"] = "if (event.target === this) this.close()"
            div("sheet-content") {
                div("sheet-handle") { }
                div("sheet-header") {
                    h2 { id = "add-payment-title"; +"Add Payment" }
                    button(type = ButtonType.button, classes = "sheet-close") {
                        attributes["onclick"] = "document.getElementById('add-payment-dialog').close()"
                        attributes["aria-label"] = "Close"
                        +"×"
                    }
                }
                form(action = "/cycles/${summary.cycle.id}/add-item", method = FormMethod.post, classes = "sheet-form") {
                    div("sheet-input-group") {
                        label {
                            attributes["for"] = "sheet-payment-name"
                            +"Payee or Bill"
                        }
                        input(type = InputType.text, name = "name") {
                            id = "sheet-payment-name"
                            placeholder = "e.g. Internet, Rent, Meralco"
                            required = true
                            attributes["autofocus"] = "autofocus"
                        }
                    }
                    div("sheet-input-group") {
                        label {
                            attributes["for"] = "sheet-payment-amount"
                            +"Amount (optional)"
                        }
                        div("amount-input-wrapper") {
                            span("amount-currency") { +"₱" }
                            input(type = InputType.text, name = "amountExpr") {
                                id = "sheet-payment-amount"
                                placeholder = "0.00"
                                attributes["inputmode"] = "decimal"
                            }
                        }
                    }
                    button(type = ButtonType.submit, classes = "sheet-submit") {
                        +"Add to Payday"
                    }
                }
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
        p { +"Reuse names and default amounts each payday." }

        details("add-saved") {
            if (templates.isEmpty()) attributes["open"] = "open"
            summary { +"Add saved item" }
            form(action = "/templates/new", method = FormMethod.post, classes = "add-box") {
                input(type = InputType.text, name = "name") {
                    placeholder = "Item name"
                    required = true
                    attributes["aria-label"] = "Saved item name"
                }
                input(type = InputType.number, name = "defaultAmount") {
                    placeholder = "Default amount"
                    step = "0.01"
                    attributes["aria-label"] = "Default amount, optional"
                }
                select {
                    name = "cadence"
                    attributes["aria-label"] = "Which payday"
                    option { value = "ANY"; +"Any payday" }
                    option { value = "MID_MONTH"; +"15th" }
                    option { value = "MONTH_END"; +"Month-end" }
                }
                button(type = ButtonType.submit) { +"Save item" }
            }
        }

        templates.forEach { tmpl ->
            details("saved-row") {
                summary {
                    span("saved-name") {
                        strong { +tmpl.name }
                        small { +tmpl.cadence.name.replace('_', ' ').lowercase() }
                    }
                    span(if (tmpl.defaultAmount == null) "bill-amount unknown" else "bill-amount") {
                        +(tmpl.defaultAmount?.let { "₱${moneyFmt.format(it)}" } ?: "Varies")
                    }
                    img(src = "/icons/edit.svg", alt = "")
                }
                div("bill-editor") {
                    form(action = "/templates/${tmpl.id}/amount", method = FormMethod.post, classes = "amount-form") {
                        input(type = InputType.text, name = "defaultAmount") {
                            value = tmpl.defaultAmount?.toString() ?: ""
                            placeholder = "Default amount"
                            attributes["aria-label"] = "Default amount for ${tmpl.name}"
                            attributes["inputmode"] = "decimal"
                        }
                        button(type = ButtonType.submit) { +"Save" }
                    }
                    form(action = "/templates/${tmpl.id}/archive", method = FormMethod.post, classes = "remove-form") {
                        attributes["onsubmit"] = "return confirm('Remove this saved item from future cycles?')"
                        button(type = ButtonType.submit) { +"Remove item" }
                    }
                }
            }
        }
    }

    fun MAIN.renderSettings() {
        h2 { +"Settings" }
        h3 { +"Account" }
        form(action = "/logout", method = FormMethod.post) {
            button(type = ButtonType.submit, classes = "settings-action") { +"Log out" }
        }
    }
}
