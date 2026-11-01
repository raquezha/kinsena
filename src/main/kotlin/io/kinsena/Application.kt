package io.kinsena

import io.kinsena.db.DatabaseService
import io.kinsena.domain.AmountParser
import io.kinsena.domain.CadenceType
import io.kinsena.web.Views.layout
import io.kinsena.web.Views.renderActive
import io.kinsena.web.Views.renderHistory
import io.kinsena.web.Views.renderTemplates
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.html.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.net.URI

private fun ApplicationCall.requireSameOrigin() {
    val origin = request.header(HttpHeaders.Origin) ?: return
    val authority = runCatching { URI(origin).rawAuthority }.getOrNull()
    require(authority != null && authority.equals(request.header(HttpHeaders.Host), ignoreCase = true)) {
        "Cross-site changes are not allowed"
    }
}

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8080
    val host = System.getenv("HOST") ?: "127.0.0.1"
    embeddedServer(Netty, port = port, host = host, module = { module() }).start(wait = true)
}

fun Application.module(db: DatabaseService = DatabaseService(System.getenv("DB_PATH") ?: "data/kinsena.db")) {
    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respondText(cause.message ?: "Invalid input", status = HttpStatusCode.BadRequest)
        }
    }
    routing {
        get("/") {
            call.respondHtml { layout("kinsena · active cycle") { renderActive(db.getActiveCycle()) } }
        }
        post("/cycles/new") {
            call.requireSameOrigin()
            val params = call.receiveParameters()
            val cadence = CadenceType.valueOf(params["cadence"] ?: "ANY")
            db.createCycle(params["title"] ?: "", cadence)
            call.respondRedirect("/")
        }
        post("/cycles/{id}/close") {
            call.requireSameOrigin()
            db.closeCycle(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid cycle"))
            call.respondRedirect("/")
        }
        post("/cycles/{id}/add-item") {
            call.requireSameOrigin()
            val cycleId = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid cycle")
            val params = call.receiveParameters()
            db.addItemToCycle(cycleId, params["name"] ?: "", params["amountExpr"] ?: "")
            call.respondRedirect("/")
        }
        post("/items/{id}/toggle") {
            call.requireSameOrigin()
            db.toggleItemDone(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid item"))
            call.respondRedirect("/")
        }
        post("/items/{id}/amount") {
            call.requireSameOrigin()
            val id = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid item")
            db.updateItemAmount(id, call.receiveParameters()["amountExpr"] ?: "")
            call.respondRedirect("/")
        }
        post("/items/{id}/delete") {
            call.requireSameOrigin()
            db.deleteItem(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid item"))
            call.respondRedirect("/")
        }
        get("/history") {
            call.respondHtml {
                layout("kinsena · history") { renderHistory(db.getHistory().filter { it.cycle.isClosed }) }
            }
        }
        get("/templates") {
            call.respondHtml { layout("kinsena · defaults") { renderTemplates(db.getTemplates()) } }
        }
        post("/templates/new") {
            call.requireSameOrigin()
            val params = call.receiveParameters()
            val amount = params["defaultAmount"]?.takeIf { it.isNotBlank() }?.let { AmountParser.parse(it).first }
            db.addTemplate(params["name"] ?: "", amount, CadenceType.valueOf(params["cadence"] ?: "ANY"))
            call.respondRedirect("/templates")
        }
        post("/templates/{id}/archive") {
            call.requireSameOrigin()
            db.archiveTemplate(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid saved item"))
            call.respondRedirect("/templates")
        }
        staticResources("/", "static")
    }
}
