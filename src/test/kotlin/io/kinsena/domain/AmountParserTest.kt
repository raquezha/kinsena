package io.kinsena.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AmountParserTest {
    @Test fun amountsAndExpressions() {
        assertEquals(29L, AmountParser.parse("0.29").first)
        assertEquals(115L, AmountParser.parse("1.15").first)
        assertEquals(1_394_191L, AmountParser.parse("10,538.91 + 3403").first)
        assertEquals(30L, AmountParser.parse("0.10 + 0.20").first)
        assertEquals(481_463L, AmountParser.parse("4814.625").first)
        assertEquals(0L to "", AmountParser.parse(" "))
        assertEquals(0L to "0", AmountParser.parse("0"))
    }

    @Test fun invalidAmountsNeverPartiallySave() {
        listOf("1000 + typo", "1 +", "-1", "1e10", "NaN", "Infinity", "1,23", "1 + + 2", "9999999999999", "0.\u0020", "2,00,000").forEach {
            assertFailsWith<IllegalArgumentException>(it) { AmountParser.parse(it) }
        }
        assertFailsWith<IllegalArgumentException> { AmountParser.parse("1".repeat(257)) }
    }
}
