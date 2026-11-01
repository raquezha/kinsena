package io.kinsena.domain

/**
 * Evaluates a simple mathematical addition expression such as:
 * "10538.91 + 3403" or single amount "4814.62"
 * Returns 0.0 if empty or unparseable.
 */
object AmountParser {
    fun parse(raw: String?): Pair<Double, String> {
        if (raw.isNullOrBlank()) return Pair(0.0, "")
        val cleaned = raw.replace(",", "").trim()
        
        // Split by '+'
        val parts = cleaned.split("+")
        var sum = 0.0
        var hasValidPart = false
        
        for (part in parts) {
            val num = part.trim().toDoubleOrNull()
            if (num != null) {
                sum += num
                hasValidPart = true
            }
        }
        
        return if (hasValidPart) {
            Pair((sum * 100).toLong() / 100.0, cleaned)
        } else {
            Pair(0.0, cleaned)
        }
    }
}
