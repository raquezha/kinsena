package io.kinsena

import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.test.assertFailsWith

class LoginTest {
    @Test fun sessionTokensAreRandomAndRevocable() {
        val passphrase = UUID.randomUUID().toString()
        val login = Login(passphrase)
        assertTrue(login.accepts(passphrase))
        val cookie = login.issue()
        assertTrue(login.valid(cookie))
        assertFalse(Login(passphrase).valid(cookie)) // restart signs out
        assertFalse(login.valid(cookie + "a"))
        assertFalse(Login(UUID.randomUUID().toString()).valid(cookie))
        assertFalse(login.valid(null))
        login.revoke(cookie)
        assertFalse(login.valid(cookie))
    }

    @Test fun incorrectPasswordsAreLimited() {
        val passphrase = UUID.randomUUID().toString()
        val login = Login(passphrase)
        repeat(10) { assertFalse(login.accepts(UUID.randomUUID().toString())) }
        assertFalse(login.accepts(passphrase))
        assertFailsWith<IllegalArgumentException> { Login(passphrase.take(10)) }
    }
}
