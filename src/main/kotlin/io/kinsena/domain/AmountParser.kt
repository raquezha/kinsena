package io.kinsena.domain

import java.math.BigDecimal
import java.math.RoundingMode

object AmountParser {
    /** Parses a peso amount or `a + b` expression into integer centavos. */
    fun parse(raw: String?): Pair<Long, String> {
        if (raw.isNullOrBlank()) return 0L to ""
        require(raw.length <= 256) { "Amount is too long" }
        val cleaned = raw.trim()
        val parts = cleaned.split('+')
        require(parts.all { it.trim().matches(Regex("(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:\\.[0-9]+)?")) }) {
            "Enter an amount or add amounts with +"
        }
        val total = parts.map { BigDecimal(it.trim().replace(",", "")) }
            .fold(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP)
        require(total <= BigDecimal("999999999999.99")) { "Amount is too large" }
        return Money.fromMajor(total) to cleaned
    }
}
