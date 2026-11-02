package io.kinsena.domain

import java.math.BigDecimal
import kotlin.test.Test
import kotlin.test.assertEquals

class MoneyTest {
    @Test fun centavosRoundTripExact() {
        assertEquals(29L, Money.fromMajor(BigDecimal("0.29")))
        assertEquals(BigDecimal("0.29"), Money.toMajor(29L))
        assertEquals(7_500_000L, Money.fromMajor(BigDecimal("75000")))
        assertEquals(BigDecimal("75000.00"), Money.toMajor(7_500_000L))
    }

    @Test fun displayUsesUsGroupingAndDotDecimal() {
        assertEquals("75,000.00", Money.formatDisplay(7_500_000L))
        assertEquals("0.29", Money.formatDisplay(29L))
        assertEquals("1,394.19", Money.formatDisplay(BigDecimal("1394.19")))
    }

    @Test fun editValueIsLocaleStableNoGrouping() {
        assertEquals("75000.00", Money.formatEdit(7_500_000L))
        assertEquals("0.29", Money.formatEdit(29L))
        // Must re-parse after edit formatting
        assertEquals(7_500_000L, AmountParser.parse(Money.formatEdit(7_500_000L)).first)
        assertEquals(29L, AmountParser.parse(Money.formatEdit(29L)).first)
    }

    @Test fun cycleSummarySumsInCentavosWithoutDoubleDrift() {
        val summary = CycleSummary(
            cycle = Cycle(id = 1, title = "Payday", date = "2026-10-15", salary = 7_500_000L),
            items = listOf(
                CycleItem(id = 1, cycleId = 1, name = "A", amount = 10L, amountExpr = "0.10"),
                CycleItem(id = 2, cycleId = 1, name = "B", amount = 20L, amountExpr = "0.20", isDone = true),
            )
        )
        assertEquals("0.30", summary.totalAmount.toPlainString())
        assertEquals("0.20", summary.paidAmount.toPlainString())
        assertEquals("0.10", summary.remainingAmount.toPlainString())
        // Net Left = salary - totalAmount (does not grow when items are marked Done)
        assertEquals("74999.70", summary.netRemaining!!.toPlainString())
    }
}
