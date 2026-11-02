package io.kinsena.web

import io.kinsena.domain.Currency
import io.kinsena.domain.CycleItem
import io.kinsena.domain.CycleSummary
import io.kinsena.domain.Money
import kotlinx.html.*

object Views {

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
                    :root { color-scheme: dark; --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; --font-mono: ui-monospace, SFMono-Regular, "Roboto Mono", Menlo, monospace; --canvas: #121517; --app: #000000; --surface: #191c1e; --surface-raised: #161a18; --surface-input: #111416; --surface-nav: #0a0d0c; --border-subtle: #1e2428; --border: #303638; --border-strong: #414749; --text: #f2f3f1; --text-muted: #aab4ad; --text-dim: #7f8e84; --accent: #b5d8c1; --accent-ink: #101512; --notice: #f1d59a; --danger: #f3aaa4; }
                    * { box-sizing: border-box; }
                    html { background: var(--canvas); min-height: 100%; display: flex; justify-content: center; }
                    body { width: 100%; max-width: 414px; min-height: 100vh; margin: 0; padding: 20px 16px; background: var(--app); color: var(--text); font: 16px/1.5 var(--font-ui); border-left: 1px solid var(--border-subtle); border-right: 1px solid var(--border-subtle); box-shadow: 0 0 50px rgba(0, 0, 0, 0.8); position: relative; }
                    @media (max-width: 414px) { body { border-left: 0; border-right: 0; box-shadow: none; } }
                    a { color: var(--accent); } input, select, button { font: inherit; border-radius: 12px; padding: 8px 16px; min-height: 48px; }
                    input, select, textarea { background: var(--surface-input); color: var(--text); border: 1px solid var(--border-strong); min-width: 0; }
                    textarea { width: 100%; min-height: 96px; resize: vertical; }
                    button { background: var(--accent); border: 0; color: var(--accent-ink); font-weight: 600; cursor: pointer; }
                    button:hover { filter: brightness(1.09); }
                    button img, summary img { display: block; width: 20px; height: 20px; }
                    article { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 20px; margin: 16px 0; }
                    form { margin: 0; } .grid { display: grid; gap: 12px; margin-bottom: 16px; }
                    .login-form { display: grid; gap: 16px; }
                    .login-form label { display: grid; gap: 8px; }
                    .login-form input, .login-form button { width: 100%; }
                    :focus-visible { outline: 2px solid #b5d8c1; outline-offset: 2px; }
                    .notice { color: var(--notice); font-size: 0.875rem; margin: -4px 0 12px; }
                    .undo-notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 8px 10px 8px 14px; margin: 0 0 12px; }
                    .undo-notice button { min-height: 36px; padding: 4px 12px; }
                    .error { color: var(--danger); }
                    .header-bar { display: flex; gap: 8px; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                    .brand { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.05em; color: var(--text); margin: 0; }
                    .brand-wrap { display: flex; align-items: center; justify-content: space-between; width: 100%; }
                    .wallet-card { position: relative; overflow: hidden; background: linear-gradient(135deg, #1b211d 0%, #0f1311 50%, var(--surface-nav) 100%); color: var(--text); border: 1px solid rgba(181, 216, 193, 0.16); border-radius: 24px; padding: 22px 22px 18px; margin-bottom: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; justify-content: space-between; min-height: 215px; }
                    .wallet-card::before { content: ""; position: absolute; top: -50px; right: -50px; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(181, 216, 193, 0.09), transparent 70%); pointer-events: none; }
                    .wallet-card::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(181, 216, 193, 0.25), transparent); pointer-events: none; }
                    .wallet-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
                    .card-chip { display: flex; align-items: center; gap: 10px; }
                    .emv-chip { width: 34px; height: 27px; border-radius: 6px; background: linear-gradient(135deg, #1c221e 0%, #0c0f0d 100%); position: relative; border: 1px solid rgba(223, 198, 153, 0.35); box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.6); display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; padding: 2.5px; box-sizing: border-box; }
                    .emv-chip span { background: linear-gradient(135deg, #fff2db 0%, #d8b370 45%, #9b7636 100%); box-shadow: 0 1px 2px rgba(0,0,0,0.4); }
                    .emv-chip span:nth-child(1) { border-radius: 0; }
                    .emv-chip span:nth-child(2) { border-radius: 4px 0 4px 4px; }
                    .emv-chip span:nth-child(3) { border-radius: 0; }
                    .emv-chip span:nth-child(4) { border-radius: 4px 4px 0 4px; }
                    .card-network { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.05em; color: #f2f3f1; text-transform: lowercase; line-height: 1; }
                    .card-digits { font-family: var(--font-mono); font-size: 0.8125rem; letter-spacing: 0.22em; color: #627267; font-weight: 500; }
                    .wallet-balance { margin: 16px 0 14px; }
                    .wallet-balance .balance-label-btn { background: transparent; border: 0; padding: 0; color: #7f8e84; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
                    .wallet-balance .balance-label-btn span { text-decoration: underline dotted #7f8e84; }
                    .wallet-balance .balance-row { display: flex; align-items: baseline; gap: 4px; }
                    .wallet-balance .balance-currency { font-size: 1.5rem; font-weight: 600; color: #b5d8c1; opacity: 0.85; }
                    .wallet-balance .balance-major { font-size: clamp(2.2rem, 9vw, 2.75rem); letter-spacing: -0.05em; font-weight: 800; color: #f2f3f1; font-variant-numeric: tabular-nums; line-height: 1; }
                    .wallet-balance .balance-minor { font-size: 1.25rem; font-weight: 600; color: #8a9c91; font-variant-numeric: tabular-nums; }
                    .wallet-salary-sub { font-size: 0.75rem; color: #7f8e84; margin-top: 4px; }
                    .wallet-salary-sub strong { color: #b5d8c1; font-weight: 600; }
                    .wallet-note { align-self: flex-start; max-width: 100%; margin: 8px 0 0; padding: 0; min-height: 0; background: transparent; color: var(--text-muted); border: 0; font-size: 0.75rem; text-align: left; overflow-wrap: anywhere; }
                    .wallet-note:hover { color: var(--text); }
                    .wallet-note-empty { color: var(--text-dim); font-style: italic; }
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
                    .bill-row { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 8px; align-items: start; background: var(--surface); color: var(--text); padding: 8px 10px; margin-bottom: 6px; border-radius: 12px; border: 1px solid var(--border); }
                    .bill-row.done { background: var(--surface-input); border-color: #272d2a; }
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
                    .bottom-nav { position: fixed; z-index: 6; left: 50%; bottom: 0; transform: translateX(-50%); width: 100%; max-width: 414px; display: grid; grid-template-columns: 1fr 1fr 64px 1fr 1fr; align-items: center; padding: 4px 8px calc(4px + env(safe-area-inset-bottom)); background: var(--surface-nav); border-top: 1px solid var(--border-subtle); border-left: 1px solid var(--border-subtle); border-right: 1px solid var(--border-subtle); }
                    @media (max-width: 414px) { .bottom-nav { border-left: 0; border-right: 0; } }
                    .bottom-nav a { display: grid; justify-items: center; align-content: center; gap: 2px; min-height: 54px; border-radius: 12px; color: var(--text-muted); font-size: 0.625rem; line-height: 1.1; text-decoration: none; white-space: nowrap; }
                    .bottom-nav img { width: 20px; height: 20px; opacity: .65; }
                    .bottom-nav a:hover, .bottom-nav a[aria-current="page"] { color: #b5d8c1; background: #b5d8c11a; }
                    .bottom-nav a[aria-current="page"] img { opacity: 1; }
                    .nav-fab-wrap { display: flex; justify-content: center; align-items: center; }
                    .nav-fab-btn { width: 52px; height: 52px; border-radius: 18px; background: var(--accent); color: var(--accent-ink); border: 0; padding: 0; display: grid; place-items: center; box-shadow: 0 -4px 16px rgba(181, 216, 193, 0.3), 0 4px 12px rgba(0,0,0,0.6); transform: translateY(-14px); cursor: pointer; transition: transform 150ms ease, box-shadow 150ms ease; }
                    .nav-fab-btn:active { transform: translateY(-11px) scale(0.94); }
                    .nav-fab-btn img { width: 24px; height: 24px; }
                    .bottom-nav a:hover, .bottom-nav a[aria-current="page"] { color: #b5d8c1; background: #b5d8c11a; }
                    .bottom-nav a[aria-current="page"] img { opacity: 1; }
                    dialog.bottom-sheet { position: fixed; inset: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; background: transparent; color: var(--text); border: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; z-index: 100; box-sizing: border-box; }
                    dialog.bottom-sheet:not([open]) { display: none; }
                    dialog.bottom-sheet::backdrop { background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); }
                    .sheet-content { width: 100%; max-width: 414px; max-height: calc(100dvh - env(safe-area-inset-top)); overflow-y: auto; box-sizing: border-box; background: var(--surface-raised); color: var(--text); border: 1px solid #2e3831; border-bottom: 0; border-radius: 28px 28px 0 0; padding: 12px 20px calc(24px + env(safe-area-inset-bottom)); box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.7); display: flex; flex-direction: column; gap: 16px; animation: slideUp 200ms cubic-bezier(0.1, 0.9, 0.2, 1); }
                    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                    .sheet-handle { width: 36px; height: 4px; background: #5a6b61; border-radius: 2px; margin: 0 auto 4px; }
                    .sheet-header { display: flex; justify-content: space-between; align-items: center; }
                    .sheet-header h2 { font-size: 1.15rem; font-weight: 700; margin: 0; color: var(--text); }
                    .sheet-close { background: #262f2a; border: 0; color: #a5afaa; width: 32px; height: 32px; min-height: 32px; border-radius: 50%; padding: 0; display: grid; place-items: center; font-size: 1.25rem; line-height: 1; cursor: pointer; }
                    .sheet-form { display: flex; flex-direction: column; gap: 14px; margin: 0; }
                    .sheet-input-group { display: flex; flex-direction: column; gap: 6px; }
                    .sheet-content p { color: var(--text-muted); margin: 0; }
                    .sheet-input-group label { font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                    .amount-input-wrapper { position: relative; display: flex; align-items: center; }
                    .amount-currency { position: absolute; left: 16px; font-size: 1.25rem; font-weight: 700; color: #b5d8c1; pointer-events: none; }
                    .amount-input-wrapper input { padding-left: 36px; font-size: 1.35rem; font-weight: 700; font-variant-numeric: tabular-nums; color: #b5d8c1; }
                    .sheet-submit { margin-top: 6px; width: 100%; min-height: 52px; background: var(--accent); color: var(--accent-ink); font-size: 1rem; font-weight: 700; border-radius: 16px; border: 0; box-shadow: 0 4px 16px rgba(181, 216, 193, 0.2); }
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
                    .settings-action { width: 100%; text-align: left; background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); }
                    .settings-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
                    .settings-row span { color: var(--text-muted); font-weight: 500; }
                    .settings-row > div { display: flex; align-items: center; gap: 8px; }
                    .settings-row strong { color: var(--text); font-size: 0.875rem; }
                    .settings-chevron { color: var(--text-dim); font-size: 1.25rem; }
                    .currency-options { display: grid; gap: 6px; }
                    .currency-option { width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
                    .currency-option > span { min-width: 0; }
                    .currency-option[aria-pressed="true"] { border-color: var(--accent); background: #b5d8c11a; }
                    .currency-option small { color: var(--text-muted); }
                    .currency-option .currency-check { color: var(--accent); font-size: 1rem; }
                    .app-version { color: var(--text-dim); font-size: 0.75rem; text-align: center; margin: 28px 0 0; font-variant-numeric: tabular-nums; }
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
                                var actDialog = document.getElementById('cycle-actions-dialog');
                                if (!actDialog) return;
                                isLongPress = true;
                                if (navigator.vibrate) navigator.vibrate(40);
                                actDialog.showModal();
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
                            if (!actDialog) return;
                            isLongPress = true;
                            actDialog.showModal();
                        });
                        fab.addEventListener('click', function(e) {
                            if (isLongPress) {
                                e.preventDefault();
                                isLongPress = false;
                                return;
                            }
                            var addDialog = document.getElementById('add-payment-dialog');
                            if (addDialog) {
                                addDialog.showModal();
                            } else {
                                window.location.href = '/';
                            }
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

    fun MAIN.renderActive(summary: CycleSummary?, currency: Currency, undoItemId: Long? = null) {
        if (summary == null) {
            article {
                h3 { +"No active payday cycle" }
                p { +"Set up recurring bills once, then each payday is a short checklist." }
                ol {
                    li { +"Add recurring bills in Defaults." }
                    li { +"Start a payday cycle with your incoming salary." }
                    li { +"Mark each bill paid as you complete it." }
                }
                p { a(href = "/templates") { +"Set up saved items" } }
                form(action = "/cycles/new", method = FormMethod.post) {
                    div(classes = "grid") {
                        input(type = InputType.text, name = "title") {
                            placeholder = "e.g. October 15 or Month-End"
                            required = true
                        }
                        div("amount-input-wrapper") {
                            span("amount-currency") { +currency.symbol }
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
                        span { +"After planned bills · Salary ${currency.symbol}${Money.formatDisplay(summary.salaryAmount!!)}" }
                    } else {
                        span { +"Remaining · ${summary.cycle.title} (tap to add salary)" }
                    }
                }
                div("balance-row") {
                    span("balance-currency") { +currency.symbol }
                    val displayAmount = summary.netRemaining ?: summary.remainingAmount
                    val formatted = Money.formatDisplay(displayAmount)
                    val parts = formatted.split(".")
                    span("balance-major") { +parts[0] }
                    if (parts.size > 1) {
                        span("balance-minor") { +".${parts[1]}" }
                    }
                }
                if (summary.salaryAmount != null) {
                    div("wallet-salary-sub") {
                        +"Obligations: "
                        strong { +"${currency.symbol}${Money.formatDisplay(summary.remainingAmount)}" }
                        +" of ${currency.symbol}${Money.formatDisplay(summary.totalAmount)}"
                    }
                }
                button(type = ButtonType.button, classes = if (summary.cycle.note.isNullOrBlank()) "wallet-note wallet-note-empty" else "wallet-note") {
                    attributes["onclick"] = "document.getElementById('cycle-note-dialog').showModal()"
                    +(summary.cycle.note ?: "Add a cycle note")
                }
            }
            div("wallet-footer") {
                div {
                    span("footer-label") { +"Cycle Target" }
                    span("footer-val") { +"${currency.symbol}${Money.formatDisplay(summary.totalAmount)}" }
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
        val undoItem = summary.items.singleOrNull { it.id == undoItemId && it.isDone }
        if (undoItem != null) {
            form(action = "/items/${undoItem.id}/toggle", method = FormMethod.post, classes = "undo-notice") {
                attributes["role"] = "status"
                attributes["aria-live"] = "polite"
                span { +"${undoItem.name} marked paid" }
                button(type = ButtonType.submit) { +"Undo" }
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
                renderBillItem(item, currency)
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
                            span("amount-currency") { +currency.symbol }
                            input(type = InputType.text, name = "salary") {
                                id = "sheet-salary-amount"
                                value = summary.cycle.salary?.let { Money.formatEdit(it) } ?: ""
                                placeholder = "50000.00"
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


        dialog("bottom-sheet") {
            id = "cycle-note-dialog"
            attributes["aria-labelledby"] = "cycle-note-title"
            attributes["onclick"] = "if (event.target === this) this.close()"
            div("sheet-content") {
                div("sheet-handle") { }
                div("sheet-header") {
                    h2 { id = "cycle-note-title"; +"Cycle note" }
                    button(type = ButtonType.button, classes = "sheet-close") {
                        attributes["onclick"] = "document.getElementById('cycle-note-dialog').close()"
                        attributes["aria-label"] = "Close"
                        +"×"
                    }
                }
                form(action = "/cycles/${summary.cycle.id}/note", method = FormMethod.post, classes = "sheet-form") {
                    label {
                        attributes["for"] = "cycle-note"
                        +"Optional context for this payday"
                    }
                    textArea {
                        id = "cycle-note"
                        name = "note"
                        attributes["maxlength"] = "280"
                        attributes["placeholder"] = "e.g. Travel month or bonus payout"
                        +summary.cycle.note.orEmpty()
                    }
                    button(type = ButtonType.submit, classes = "sheet-submit") { +"Save note" }
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
                            span("amount-currency") { +currency.symbol }
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

    fun FlowContent.renderBillItem(item: CycleItem, currency: Currency) {
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
                        +(if (item.amountExpr.isNullOrBlank()) "Set amount" else "${currency.symbol}${Money.formatDisplay(item.amount)}")
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

    fun MAIN.renderHistory(history: List<CycleSummary>, canReopen: Boolean, currency: Currency) {
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
                        +"${currency.symbol}${Money.formatDisplay(summary.totalAmount)}"
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
                                +"${item.name} — ${currency.symbol}${Money.formatDisplay(item.amount)}"
                            }
                        }
                    }
                }
            }
        }
    }

    fun MAIN.renderTemplates(templates: List<io.kinsena.domain.TemplateItem>, currency: Currency) {
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
                        +(tmpl.defaultAmount?.let { "${currency.symbol}${Money.formatDisplay(it)}" } ?: "Varies")
                    }
                    img(src = "/icons/edit.svg", alt = "")
                }
                div("bill-editor") {
                    form(action = "/templates/${tmpl.id}/amount", method = FormMethod.post, classes = "amount-form") {
                        input(type = InputType.text, name = "defaultAmount") {
                            value = tmpl.defaultAmount?.let { Money.formatEdit(it) } ?: ""
                            placeholder = "18500.50"
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

    fun MAIN.renderSettings(currency: Currency, version: String) {
        h2 { +"Settings" }
        h3 { +"Currency" }
        button(type = ButtonType.button, classes = "settings-action settings-row") {
            attributes["onclick"] = "document.getElementById('currency-dialog').showModal()"
            span { +"Currency" }
            div {
                strong { +"${currency.label} (${currency.symbol})" }
                span("settings-chevron") { +"›" }
            }
        }
        dialog("bottom-sheet") {
            id = "currency-dialog"
            attributes["aria-labelledby"] = "currency-title"
            attributes["onclick"] = "if (event.target === this) this.close()"
            div("sheet-content") {
                div("sheet-handle") { }
                div("sheet-header") {
                    h2 { id = "currency-title"; +"Display currency" }
                    button(type = ButtonType.button, classes = "sheet-close") {
                        attributes["onclick"] = "document.getElementById('currency-dialog').close()"
                        attributes["aria-label"] = "Close"
                        +"×"
                    }
                }
                p { +"This changes how amounts display. It does not convert existing amounts." }
                div("currency-options") {
                    Currency.entries.forEach { optionCurrency ->
                        form(action = "/settings/currency", method = FormMethod.post) {
                            button(type = ButtonType.submit, classes = "currency-option") {
                                name = "currency"
                                value = optionCurrency.name
                                attributes["aria-pressed"] = (optionCurrency == currency).toString()
                                span {
                                    +"${optionCurrency.label}"
                                    small { +" ${optionCurrency.symbol}" }
                                }
                                if (optionCurrency == currency) span("currency-check") { +"✓" }
                            }
                        }
                    }
                }
            }
        }
        h3 { +"Account" }
        form(action = "/logout", method = FormMethod.post) {
            button(type = ButtonType.submit, classes = "settings-action") { +"Log out" }
        }
        p("app-version") { +"Kinsena $version" }
    }
}
