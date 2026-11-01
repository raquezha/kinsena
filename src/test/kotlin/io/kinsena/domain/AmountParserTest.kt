package io.kinsena.domain

import kotlin.test.Test
import kotlin.test.assertEquals

class AmountParserTest {

    @Test
    fun `parses single amount correctly`() {
        val (amount, expr) = AmountParser.parse("4814.62")
        assertEquals(4814.62, amount)
        assertEquals("4814.62", expr)
    }

    @Test
    fun `parses math expressions with commas and plus signs`() {
        val (amount, _) = AmountParser.parse("10,538.91 + 3403")
        assertEquals(13941.91, amount)
    }

    @Test
    fun `handles blank or invalid input safely`() {
        val (amount, _) = AmountParser.parse("")
        assertEquals(0.0, amount)
    }
}
