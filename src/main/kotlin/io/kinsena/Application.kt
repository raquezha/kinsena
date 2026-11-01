package io.kinsena

import io.kinsena.db.DatabaseService
import io.kinsena.domain.AmountParser
import io.kinsena.domain.CadenceType
import io.kinsena.web.Views.layout
import io.kinsena.web.Views.renderActive
import io.kinsena.web.Views.renderHistory
import io.kinsena.web.Views.renderLogin
import io.kinsena.web.Views.renderTemplates
import io.ktor.http.*
import io.ktor.http.Cookie
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.html.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.html.*
import java.net.URI

private fun ApplicationCall.secureCookie(): Boolean =
    request.header(HttpHeaders.Host)?.substringBefore(':') !in setOf("localhost", "127.0.0.1")

private suspend fun ApplicationCall.authorized(login: Login): Boolean {
    if (login.valid(request.cookies["kinsena_session"])) return true
    if (request.httpMethod == HttpMethod.Get) respondRedirect("/login") else respond(HttpStatusCode.Unauthorized)
    return false
}

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

fun Application.module(
    db: DatabaseService = DatabaseService(System.getenv("DB_PATH") ?: "data/kinsena.db"),
    login: Login = Login.fromFile()
) {
    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respondHtml(HttpStatusCode.BadRequest) {
                layout("kinsena · error", false) {
                    article {
                        h2 { +"Could not save" }
                        p { +(cause.message ?: "Invalid input") }
                        a(href = "/") { +"Back to checklist" }
                        p { a(href = "/templates") { +"Saved items" } }
                    }
                }
            }
        }
    }
    routing {
        get("/login") {
            if (login.valid(call.request.cookies["kinsena_session"])) call.respondRedirect("/")
            else call.respondHtml { layout("kinsena · sign in", false) { renderLogin() } }
        }
        post("/login") {
            call.requireSameOrigin()
            val password = call.receiveParameters()["password"] ?: ""
            if (!login.accepts(password)) {
                call.respondHtml(HttpStatusCode.Unauthorized) { layout("kinsena · sign in", false) { renderLogin(true) } }
                return@post
            }
            call.response.cookies.append(Cookie(
                name = "kinsena_session", value = login.issue(), path = "/",
                httpOnly = true, secure = call.secureCookie(), maxAge = 604800,
                extensions = mapOf("SameSite" to "Strict")
            ))
            call.respondRedirect("/")
        }
        post("/logout") {
            call.requireSameOrigin()
            login.revoke(call.request.cookies["kinsena_session"])
            call.response.cookies.append(Cookie(
                name = "kinsena_session", value = "", path = "/", maxAge = 0,
                httpOnly = true, secure = call.secureCookie(), extensions = mapOf("SameSite" to "Strict")
            ))
            call.respondRedirect("/login")
        }
        get("/") {
            if (!call.authorized(login)) return@get
            call.respondHtml { layout("kinsena · active cycle") { renderActive(db.getActiveCycle()) } }
        }
        post("/cycles/new") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            val params = call.receiveParameters()
            val cadence = CadenceType.valueOf(params["cadence"] ?: "ANY")
            db.createCycle(params["title"] ?: "", cadence)
            call.respondRedirect("/")
        }
        post("/cycles/{id}/close") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            db.closeCycle(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid cycle"))
            call.respondRedirect("/")
        }
        post("/cycles/{id}/reopen") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            db.reopenCycle(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid cycle"))
            call.respondRedirect("/")
        }
        post("/cycles/{id}/add-item") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            val cycleId = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid cycle")
            val params = call.receiveParameters()
            db.addItemToCycle(cycleId, params["name"] ?: "", params["amountExpr"] ?: "")
            call.respondRedirect("/")
        }
        post("/items/{id}/toggle") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            db.toggleItemDone(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid item"))
            call.respondRedirect("/")
        }
        post("/items/{id}/amount") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            val id = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid item")
            db.updateItemAmount(id, call.receiveParameters()["amountExpr"] ?: "")
            call.respondRedirect("/")
        }
        post("/items/{id}/delete") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            db.deleteItem(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid item"))
            call.respondRedirect("/")
        }
        get("/history") {
            if (!call.authorized(login)) return@get
            call.respondHtml {
                layout("kinsena · history") {
                    renderHistory(db.getHistory().filter { it.cycle.isClosed }, db.getActiveCycle() == null)
                }
            }
        }
        get("/templates") {
            if (!call.authorized(login)) return@get
            call.respondHtml { layout("kinsena · defaults") { renderTemplates(db.getTemplates()) } }
        }
        post("/templates/new") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            val params = call.receiveParameters()
            val amount = params["defaultAmount"]?.takeIf { it.isNotBlank() }?.let { AmountParser.parse(it).first }
            db.addTemplate(params["name"] ?: "", amount, CadenceType.valueOf(params["cadence"] ?: "ANY"))
            call.respondRedirect("/templates")
        }
        post("/templates/{id}/amount") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            val id = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid saved item")
            val raw = call.receiveParameters()["defaultAmount"]?.takeIf { it.isNotBlank() }
            db.updateTemplateAmount(id, raw?.let { AmountParser.parse(it).first })
            call.respondRedirect("/templates")
        }
        post("/templates/{id}/archive") {
            if (!call.authorized(login)) return@post
            call.requireSameOrigin()
            db.archiveTemplate(call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid saved item"))
            call.respondRedirect("/templates")
        }
        staticResources("/", "static")
    }
}
