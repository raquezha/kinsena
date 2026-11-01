package io.kinsena

import java.nio.file.Files
import java.nio.file.Path
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64
import java.util.concurrent.ConcurrentHashMap

class Login(password: String) {
    init { require(password.length >= 16) { "Use a passphrase of at least 16 characters" } }

    private val passwordHash = digest(password.toByteArray(Charsets.UTF_8))
    private val failures = ArrayDeque<Long>()
    private val sessions = ConcurrentHashMap<String, Long>()
    private val random = SecureRandom()

    @Synchronized fun accepts(candidate: String): Boolean {
        val now = System.currentTimeMillis()
        while (failures.isNotEmpty() && now - failures.first() > 60_000) failures.removeFirst()
        if (failures.size >= 10) return false
        val valid = candidate.length <= 1024 && MessageDigest.isEqual(passwordHash, digest(candidate.toByteArray(Charsets.UTF_8)))
        if (!valid) failures.addLast(now)
        else failures.clear()
        return valid
    }

    fun issue(): String {
        val bytes = ByteArray(32).also(random::nextBytes)
        val token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
        val now = Instant.now().epochSecond
        sessions.entries.removeIf { it.value <= now }
        sessions[token] = now + 604800
        return token
    }

    fun valid(token: String?): Boolean {
        if (token == null) return false
        val expiry = sessions[token] ?: return false
        if (expiry > Instant.now().epochSecond) return true
        sessions.remove(token)
        return false
    }

    fun revoke(token: String?) {
        if (token != null) sessions.remove(token)
    }

    companion object {
        private fun digest(bytes: ByteArray) = MessageDigest.getInstance("SHA-256").digest(bytes)

        fun fromFile(): Login {
            val path = System.getenv("KINSENA_PASSWORD_FILE") ?: error("Set KINSENA_PASSWORD_FILE to a private password file")
            return Login(Files.readString(Path.of(path)).trimEnd('\r', '\n'))
        }
    }
}
