package io.kinsena

import io.kinsena.db.DatabaseService
import io.kinsena.domain.CadenceType
import io.kinsena.web.Views
import io.kinsena.web.Views.layout
import io.kinsena.web.Views.renderActive
import io.kinsena.web.Views.renderBillItem
import io.kinsena.web.Views.renderHistory
import io.kinsena.web.Views.renderTemplates
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.html.*
import io.ktor.server.netty.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.html.div
import kotlinx.html.stream.createHTML

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8080
    println("Starting kinsena on http://0.0.0.0:$port ...")

    embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    val db = DatabaseService(System.getenv("DB_PATH") ?: "data/kinsena.db")

    routing {
        // Home: Active Cycle
        get("/") {
            val active = db.getActiveCycle()
            call.respondHtml {
                layout("kinsena · active cycle") {
                    renderActive(active)
                }
            }
        }

        // Create new cycle
        post("/cycles/new") {
            val params = call.receiveParameters()
            val title = params["title"] ?: "Payday"
            val cadenceStr = params["cadence"] ?: "ANY"
            val cadence = try { CadenceType.valueOf(cadenceStr) } catch (e: Exception) { CadenceType.ANY }

            db.createCycle(title, cadence)
            call.respondRedirect("/")
        }

        // Finish/Close active cycle
        post("/cycles/{id}/close") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id != null) {
                db.closeCycle(id)
            }
            call.respondRedirect("/")
        }

        // Add payee to active cycle
        post("/cycles/{id}/add-item") {
            val cycleId = call.parameters["id"]?.toLongOrNull()
            val params = call.receiveParameters()
            val name = params["name"]
            val amountExpr = params["amountExpr"] ?: ""

            if (cycleId != null && !name.isNullOrBlank()) {
                db.addItemToCycle(cycleId, name, amountExpr)
            }
            call.respondRedirect("/")
        }

        // HTMX: Toggle done/pending
        post("/items/{id}/toggle") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id != null) {
                db.toggleItemDone(id)
            }
            // Return updated items list fragment for HTMX swap
            val active = db.getActiveCycle()
            val html = createHTML().div {
                active?.items?.forEach { item ->
                    renderBillItem(item)
                }
            }
            call.respondText(html, ContentType.Text.Html)
        }

        // HTMX: Update item amount expression
        post("/items/{id}/amount") {
            val id = call.parameters["id"]?.toLongOrNull()
            val params = call.receiveParameters()
            val amountExpr = params["amountExpr"] ?: ""

            if (id != null) {
                db.updateItemAmount(id, amountExpr)
            }
            val active = db.getActiveCycle()
            val html = createHTML().div {
                active?.items?.forEach { item ->
                    renderBillItem(item)
                }
            }
            call.respondText(html, ContentType.Text.Html)
        }

        // HTMX: Delete item from cycle
        delete("/items/{id}") {
            val id = call.parameters["id"]?.toLongOrNull()
            if (id != null) {
                db.deleteItem(id)
            }
            val active = db.getActiveCycle()
            val html = createHTML().div {
                active?.items?.forEach { item ->
                    renderBillItem(item)
                }
            }
            call.respondText(html, ContentType.Text.Html)
        }

        // History page
        get("/history") {
            val history = db.getHistory().filter { it.cycle.isClosed }
            call.respondHtml {
                layout("kinsena · history") {
                    renderHistory(history)
                }
            }
        }

        // Templates/Defaults page
        get("/templates") {
            val templates = db.getTemplates()
            call.respondHtml {
                layout("kinsena · defaults") {
                    renderTemplates(templates)
                }
            }
        }

        post("/templates/new") {
            val params = call.receiveParameters()
            val name = params["name"]
            val defAmt = params["defaultAmount"]?.toDoubleOrNull()
            val cadenceStr = params["cadence"] ?: "ANY"
            val cadence = try { CadenceType.valueOf(cadenceStr) } catch (e: Exception) { CadenceType.ANY }

            if (!name.isNullOrBlank()) {
                db.addTemplate(name, defAmt, cadence)
            }
            call.respondRedirect("/templates")
        }
    }
}
