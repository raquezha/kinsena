package io.kinsena.domain

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale

/** Payday amounts are stored as integer centavos (1/100 of a peso). */
object Money {
    private val symbols = DecimalFormatSymbols(Locale.US)

    /** DecimalFormat is not thread-safe; create a fresh instance per format call. */
    private fun displayFormatter() = DecimalFormat("#,##0.00", symbols)

    fun fromMajor(amount: BigDecimal): Long =
        amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact()

    fun toMajor(cents: Long): BigDecimal = BigDecimal.valueOf(cents, 2)

    fun formatDisplay(cents: Long): String = displayFormatter().format(toMajor(cents))

    fun formatDisplay(amount: BigDecimal): String =
        displayFormatter().format(amount.setScale(2, RoundingMode.HALF_UP))

    /** Locale-stable edit value: always dot decimal, no grouping. */
    fun formatEdit(cents: Long): String = toMajor(cents).toPlainString()
}
