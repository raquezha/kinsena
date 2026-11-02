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
        listOf("/", "/history", "/templates", "/settings").forEach { path ->
            assertTrue(client.get(path).bodyAsText().contains("Sign in"))
        }
        listOf("/cycles/new", "/cycles/1/note", "/cycles/1/close", "/cycles/1/reopen", "/cycles/1/add-item", "/items/1/toggle", "/items/1/amount", "/items/1/delete", "/templates/new", "/templates/1/amount", "/templates/1/archive", "/settings/currency").forEach { path ->
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
        val settings = get("/settings").bodyAsText()
        assertTrue(settings.contains("Log out"))
        assertTrue(settings.contains("Kinsena 0.1.0"))
        assertTrue(settings.contains("id=\"currency-dialog\""))
        assertTrue(settings.contains("class=\"currency-option\""))
        assertTrue(settings.contains("value=\"PHP\""))
        assertTrue(settings.contains("aria-pressed=\"true\""))
        assertTrue(settings.contains("does not convert existing amounts"))
        assertEquals(HttpStatusCode.Found, post("/settings/currency", "currency" to "USD").status)
        assertTrue(get("/settings").bodyAsText().contains("value=\"USD\""))
        assertEquals(HttpStatusCode.BadRequest, post("/settings/currency", "currency" to "INVALID").status)
        assertFalse(get("/").bodyAsText().contains("Log out"))
        assertTrue(client.get("/manifest.webmanifest").bodyAsText().contains("standalone"))
        assertEquals(HttpStatusCode.OK, client.get("/icon-192.png").status)
        assertEquals(HttpStatusCode.OK, client.get("/icon.svg").status)
        assertEquals(HttpStatusCode.OK, client.get("/icons/check.svg").status)
        assertEquals(HttpStatusCode.OK, client.get("/icons/edit.svg").status)
        assertEquals(HttpStatusCode.OK, client.get("/icons/plus.svg").status)
        listOf("active", "history", "defaults", "settings").forEach { icon ->
            assertEquals(HttpStatusCode.OK, client.get("/icons/nav-$icon.svg").status)
        }
        assertEquals(HttpStatusCode.Found, post("/templates/new", "name" to "Internet", "defaultAmount" to "0.29", "cadence" to "ANY").status)
        assertEquals(29L, db.getTemplates().single().defaultAmount)
        assertEquals(HttpStatusCode.Found, post("/templates/new", "name" to "Variable", "cadence" to "ANY").status)
        assertTrue(get("/templates").bodyAsText().contains("class=\"saved-row\""))
        assertTrue(get("/templates").bodyAsText().contains("$0.29"))
        assertEquals(HttpStatusCode.Found, post("/cycles/new", "title" to "Payday", "cadence" to "ANY").status)
        val cycle = db.getActiveCycle()!!
        assertEquals(1, cycle.missingCount)
        assertEquals("0.29", cycle.totalAmount.toPlainString())
        val home = get("/").bodyAsText()
        assertTrue(home.contains("1 amount missing; totals exclude it."))
        assertTrue(home.contains("bill-details"))
        assertTrue(home.contains("class=\"nav-fab-btn\""))
        assertTrue(home.contains("class=\"bottom-nav\""))
        assertTrue(home.contains("aria-current=\"page\""))
        assertTrue(home.contains("id=\"cycle-actions-dialog\""))
        assertTrue(home.contains("Finish Payday Cycle"))
        assertFalse(home.contains("Log out"))
        assertTrue(get("/settings").bodyAsText().contains("/logout"))
        assertTrue(home.contains("Set amount"))
        val item = cycle.items.single { it.name == "Variable" }.id
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/amount", "amountExpr" to "1000 + typo").status)
        assertEquals(1, db.getActiveCycle()!!.missingCount)
        assertEquals(HttpStatusCode.Found, post("/items/$item/amount", "amountExpr" to "0.10 + 0.20").status)
        assertEquals("0.59", db.getActiveCycle()!!.totalAmount.toPlainString())
        assertEquals(HttpStatusCode.Found, post("/items/$item/toggle").status)
        assertTrue(get("/").bodyAsText().contains("1 of 2"))
        assertEquals("0.30", db.getActiveCycle()!!.paidAmount.toPlainString())
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/new", "title" to "Second", "cadence" to "ANY").status)
        assertEquals(HttpStatusCode.Found, post("/cycles/${cycle.cycle.id}/close").status)
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/toggle").status)
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/delete").status)
        assertEquals(HttpStatusCode.BadRequest, post("/items/$item/amount", "amountExpr" to "99").status)
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/${cycle.cycle.id}/add-item", "name" to "Late").status)
        assertTrue(get("/history").bodyAsText().contains("Reopen this cycle"))
        assertEquals("0.30", db.getHistory().single().paidAmount.toPlainString())
        assertEquals(HttpStatusCode.Found, post("/cycles/${cycle.cycle.id}/reopen").status)
        assertEquals("0.30", db.getActiveCycle()!!.paidAmount.toPlainString())
        assertEquals(HttpStatusCode.Found, post("/cycles/${cycle.cycle.id}/close").status)
        val fixedId = db.getTemplates().single { it.name == "Internet" }.id
        assertEquals(HttpStatusCode.BadRequest, post("/templates/$fixedId/amount", "defaultAmount" to "2 + nope").status)
        assertEquals(29L, db.getTemplates().single { it.id == fixedId }.defaultAmount)
        assertEquals(HttpStatusCode.Found, post("/templates/$fixedId/amount", "defaultAmount" to "2.55").status)
        val savedId = db.getTemplates().single { it.name == "Variable" }.id
        assertEquals(HttpStatusCode.Found, post("/templates/$savedId/archive").status)
        assertEquals(HttpStatusCode.Found, post("/cycles/new", "title" to "Next", "cadence" to "ANY").status)
        assertFalse(db.getActiveCycle()!!.items.any { it.isDone })
        assertFalse(db.getActiveCycle()!!.items.any { it.name == "Variable" })
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/${cycle.cycle.id}/reopen").status)
        assertEquals(255L, db.getActiveCycle()!!.items.single().amount)
        assertEquals(29L, db.getHistory().first { it.cycle.isClosed }.items.single { it.name == "Internet" }.amount)
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
        val home = client.get("/") { header(HttpHeaders.Cookie, cookie) }.bodyAsText()
        assertTrue(home.contains("id=\"add-payment-dialog\""))
        assertTrue(home.contains("aria-labelledby=\"add-payment-title\""))
        assertEquals(HttpStatusCode.Found, post("/cycles/${db.getActiveCycle()!!.cycle.id}/add-item", "name" to "One-off", "amountExpr" to "25").status)
        assertTrue(db.getActiveCycle()!!.items.any { it.name == "One-off" && it.amount == 2500L })
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/9999/close").status)
    }

    @Test fun fabClickHandlerDoesNotNavigateWhenShowModalReturnsUndefined() = testApplication {
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
        post("/templates/new", "name" to "Rent", "defaultAmount" to "100", "cadence" to "ANY")
        post("/cycles/new", "title" to "October 15", "cadence" to "ANY", "salary" to "75000")
        val home = client.get("/") { header(HttpHeaders.Cookie, cookie) }.bodyAsText()

        // P1: must not use showModal() || navigate (undefined is falsy)
        assertFalse(home.contains("showModal() ||"))
        assertFalse(home.contains("showModal()||"))
        assertTrue(home.contains("var addDialog = document.getElementById('add-payment-dialog');"))
        assertTrue(home.contains("if (addDialog)"))
        assertTrue(home.contains("addDialog.showModal();"))
        assertTrue(home.contains("window.location.href = '/'"))
        assertTrue(home.contains("if (isLongPress)"))
        assertTrue(home.contains("fab.addEventListener('click'"))
        assertTrue(home.contains("id=\"add-payment-dialog\""))
        assertTrue(home.contains("id=\"cycle-actions-dialog\""))
        // P3: long-press must not set isLongPress when cycle-actions dialog is absent
        assertTrue(home.contains("if (!actDialog) return;"))
        val longPressTimeout = home.substringAfter("timer = setTimeout(function() {").substringBefore("}, 500);")
        assertTrue(longPressTimeout.indexOf("if (!actDialog) return;") < longPressTimeout.indexOf("isLongPress = true;"))
    }

    @Test fun salaryRoundTripsWithLocaleStableEditValueAndNetLeft() = testApplication {
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

        assertEquals(HttpStatusCode.Found, post("/templates/new", "name" to "Rent", "defaultAmount" to "18500.50", "cadence" to "ANY").status)
        assertEquals(1_850_050L, db.getTemplates().single().defaultAmount)
        assertEquals(HttpStatusCode.Found, post("/cycles/new", "title" to "October 15", "cadence" to "ANY", "salary" to "75000").status)
        assertEquals(7_500_000L, db.getActiveCycle()!!.cycle.salary)
        assertEquals("18500.50", db.getActiveCycle()!!.totalAmount.toPlainString())
        assertEquals("56499.50", db.getActiveCycle()!!.netRemaining!!.toPlainString())

        val home = client.get("/") { header(HttpHeaders.Cookie, cookie) }.bodyAsText()
        assertTrue(home.contains("id=\"salary-dialog\""))
        assertTrue(home.contains("id=\"cycle-note-dialog\""))
        assertTrue(home.contains("id=\"sheet-salary-amount\""))
        // edit field must be plain US number, not locale-grouped (e.g. 75,000.00)
        assertTrue(home.contains("value=\"75000.00\""))
        assertFalse(home.contains("value=\"75,000.00\""))
        assertTrue(home.contains("After planned bills"))
        // Balance major/minor are split across spans: 56,499 + .50
        assertTrue(home.contains("class=\"balance-major\""))
        assertTrue(home.contains("56,499"))
        assertTrue(home.contains("class=\"balance-minor\""))
        assertTrue(home.contains(".50"))

        // Net Left stays constant when marking bills Done (salary - total, not salary - remaining)
        val itemId = db.getActiveCycle()!!.items.single().id
        val beforeToggle = db.getActiveCycle()!!.netRemaining!!.toPlainString()
        val toggleResponse = post("/items/$itemId/toggle")
        assertEquals(HttpStatusCode.Found, toggleResponse.status)
        assertEquals("/?undoItem=$itemId", toggleResponse.headers[HttpHeaders.Location])
        assertTrue(client.get("/?undoItem=$itemId") { header(HttpHeaders.Cookie, cookie) }.bodyAsText().contains("marked paid"))
        assertEquals(beforeToggle, db.getActiveCycle()!!.netRemaining!!.toPlainString())
        assertEquals("18500.50", db.getActiveCycle()!!.paidAmount.toPlainString())

        val cycleId = db.getActiveCycle()!!.cycle.id
        assertEquals(HttpStatusCode.Found, post("/cycles/$cycleId/note", "note" to "Bonus payout").status)
        assertEquals("Bonus payout", db.getActiveCycle()!!.cycle.note)
        assertTrue(client.get("/") { header(HttpHeaders.Cookie, cookie) }.bodyAsText().contains("Bonus payout"))
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/$cycleId/note", "note" to "x".repeat(281)).status)
        assertEquals("Bonus payout", db.getActiveCycle()!!.cycle.note)
        assertEquals(HttpStatusCode.Found, post("/cycles/$cycleId/salary", "salary" to "80000.25").status)
        assertEquals(8_000_025L, db.getActiveCycle()!!.cycle.salary)
        assertEquals("61499.75", db.getActiveCycle()!!.netRemaining!!.toPlainString())

        val updated = client.get("/") { header(HttpHeaders.Cookie, cookie) }.bodyAsText()
        assertTrue(updated.contains("value=\"80000.25\""))
        assertEquals(HttpStatusCode.Found, post("/cycles/$cycleId/salary", "salary" to "80,000.25").status)
        assertEquals(8_000_025L, db.getActiveCycle()!!.cycle.salary)
        assertEquals(HttpStatusCode.BadRequest, post("/cycles/$cycleId/salary", "salary" to "50.000,00").status)
        assertEquals(8_000_025L, db.getActiveCycle()!!.cycle.salary)
        assertEquals(HttpStatusCode.Unauthorized, client.post("/cycles/$cycleId/salary") {
            setBody(FormDataContent(Parameters.build { append("salary", "1") }))
        }.status)
    }

    @Test fun defaultsEditorUsesLocaleStableEditValueNotRawCentavos() = testApplication {
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

        assertEquals(HttpStatusCode.Found, post("/templates/new", "name" to "Rent", "defaultAmount" to "18500.50", "cadence" to "ANY").status)
        assertEquals(1_850_050L, db.getTemplates().single().defaultAmount)
        val defaults = client.get("/templates") { header(HttpHeaders.Cookie, cookie) }.bodyAsText()
        assertTrue(defaults.contains("value=\"18500.50\""))
        assertFalse(defaults.contains("value=\"1850050\""))
        assertTrue(defaults.contains("₱18,500.00") || defaults.contains("₱18,500.50"))

        val id = db.getTemplates().single().id
        // Saving the edit value without change must not inflate to ₱1,850,050
        assertEquals(HttpStatusCode.Found, post("/templates/$id/amount", "defaultAmount" to "18500.50").status)
        assertEquals(1_850_050L, db.getTemplates().single().defaultAmount)
    }
}
