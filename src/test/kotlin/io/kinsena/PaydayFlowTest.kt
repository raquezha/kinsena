package io.kinsena

import io.kinsena.db.DatabaseService
import io.ktor.client.request.*
import io.ktor.client.request.forms.FormDataContent
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import java.nio.file.Files
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PaydayFlowTest {
    private fun database() = DatabaseService(Files.createTempDirectory("kinsena-test").resolve("test.db").toString())

    @Test fun paydayFlowKeepsHistoryAndRejectsInvalidChanges() = testApplication {
        val db = database()
        val passphrase = UUID.randomUUID().toString()
        application { module(db, Login(passphrase)) }
        listOf("/", "/history", "/templates").forEach { path ->
            assertTrue(client.get(path).bodyAsText().contains("Sign in"))
        }
        listOf("/cycles/new", "/cycles/1/close", "/cycles/1/add-item", "/items/1/toggle", "/items/1/amount", "/items/1/delete", "/templates/new", "/templates/1/archive").forEach { path ->
            assertEquals(HttpStatusCode.Unauthorized, client.post(path).status, path)
        }
        assertEquals(HttpStatusCode.Unauthorized, client.post("/login") {
            setBody(FormDataContent(Parameters.build { append("password", passphrase.reversed()) }))
        }.status)
        val loginResponse = client.post("/login") {
            header(HttpHeaders.Host, "private.example")
            setBody(FormDataContent(Parameters.build { append("password", passphrase) }))
        }
        assertEquals(HttpStatusCode.Found, loginResponse.status)
        assertTrue(loginResponse.headers[HttpHeaders.SetCookie]!!.contains("Secure"))
        assertTrue(loginResponse.headers[HttpHeaders.SetCookie]!!.contains("HttpOnly"))
        assertTrue(loginResponse.headers[HttpHeaders.SetCookie]!!.contains("SameSite=Strict"))
        val cookie = loginResponse.headers[HttpHeaders.SetCookie]!!.substringBefore(';')
        suspend fun get(path: String) = client.get(path) { header(HttpHeaders.Cookie, cookie) }
        suspend fun post(path: String, vararg fields: Pair<String, String>) = client.post(path) {
            header(HttpHeaders.Cookie, cookie)
            setBody(FormDataContent(Parameters.build { fields.forEach { (k, v) -> append(k, v) } }))
        }

        assertTrue(db.getTemplates().isEmpty())
        assertTrue(client.get("/manifest.webmanifest").bodyAsText().contains("standalone"))
        assertEquals(HttpStatusCode.OK, client.get("/icon-192.png").status)
        assertEquals(HttpStatusCode.Found, post("/templates/new", "name" to "Internet", "defaultAmount" to "0.29", "cadence" to "ANY").status)
        assertEquals(0.29, db.getTemplates().single().defaultAmount)
        assertEquals(HttpStatusCode.Found, post("/templates/new", "name" to "Variable", "cadence" to "ANY").status)
        assertEquals(HttpStatusCode.Found, post("/cycles/new", "title" to "Payday", "cadence" to "ANY").status)
        val cycle = db.getActiveCycle()!!
        assertEquals(1, cycle.missingCount)
        assertEquals("0.29", cycle.totalAmount.toPlainString())
        assertTrue(get("/").bodyAsText().contains("1 amount(s) missing"))
        val item = cycle.items.single { it.name == "Variable" }.id
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/amount", "amountExpr" to "1000 + typo").status)
        assertEquals(1, db.getActiveCycle()!!.missingCount)
        assertEquals(HttpStatusCode.Found, post("/items/$item/amount", "amountExpr" to "0.10 + 0.20").status)
        assertEquals("0.59", db.getActiveCycle()!!.totalAmount.toPlainString())
        assertEquals(HttpStatusCode.Found, post("/items/$item/toggle").status)
        assertTrue(get("/").bodyAsText().contains("1 Paid"))
        assertEquals("0.3", db.getActiveCycle()!!.paidAmount.toPlainString())
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/new", "title" to "Second", "cadence" to "ANY").status)
        assertEquals(HttpStatusCode.Found, post("/cycles/${cycle.cycle.id}/close").status)
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/toggle").status)
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/delete").status)
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/amount", "amountExpr" to "99").status)
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/${cycle.cycle.id}/add-item", "name" to "Late").status)
        assertTrue(get("/history").bodyAsText().contains("Payday"))
        assertEquals("0.3", db.getHistory().single().paidAmount.toPlainString())
        val savedId = db.getTemplates().single { it.name == "Variable" }.id
        assertEquals(HttpStatusCode.Found, post("/templates/$savedId/archive").status)
        assertEquals(HttpStatusCode.Found, post("/cycles/new", "title" to "Next", "cadence" to "ANY").status)
        assertFalse(db.getActiveCycle()!!.items.any { it.isDone })
        assertFalse(db.getActiveCycle()!!.items.any { it.name == "Variable" })
        assertTrue(db.getHistory().first { it.cycle.isClosed }.items.any { it.name == "Variable" })
        assertEquals(HttpStatusCode.Found, post("/logout").status)
        assertTrue(client.get("/history").bodyAsText().contains("Sign in"))
        assertTrue(get("/history").bodyAsText().contains("Sign in")) // old cookie cannot be replayed
    }

    @Test fun blankAndZeroAreDifferentAndInputsHaveLimits() = testApplication {
        val db = database()
        val passphrase = UUID.randomUUID().toString()
        application { module(db, Login(passphrase)) }
        val cookie = client.post("/login") {
            setBody(FormDataContent(Parameters.build { append("password", passphrase) }))
        }.headers[HttpHeaders.SetCookie]!!.substringBefore(';')
        suspend fun post(path: String, vararg fields: Pair<String, String>) = client.post(path) {
            header(HttpHeaders.Cookie, cookie)
            setBody(FormDataContent(Parameters.build { fields.forEach { (k, v) -> append(k, v) } }))
        }
        assertEquals(HttpStatusCode.BadRequest, post("/templates/new", "name" to "x".repeat(129)).status)
        assertEquals(HttpStatusCode.BadRequest, post("/templates/new", "name" to "Item", "defaultAmount" to "-1").status)
        post("/templates/new", "name" to "Item")
        post("/cycles/new", "title" to "Test")
        val item = db.getActiveCycle()!!.items.single().id
        assertEquals(1, db.getActiveCycle()!!.missingCount)
        assertEquals(HttpStatusCode.BadRequest, client.post("/items/$item/toggle") {
            header(HttpHeaders.Cookie, cookie)
            header(HttpHeaders.Origin, "https://other.example")
        }.status)
        assertFalse(db.getActiveCycle()!!.items.single().isDone)
        post("/items/$item/amount", "amountExpr" to "0")
        assertEquals(0, db.getActiveCycle()!!.missingCount)
        post("/items/$item/amount", "amountExpr" to "")
        assertEquals(1, db.getActiveCycle()!!.missingCount)
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/9999/close").status)
    }
}
