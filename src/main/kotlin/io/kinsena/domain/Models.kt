package io.kinsena.domain

import java.math.BigDecimal

enum class CadenceType {
    MID_MONTH,   // ~15th
    MONTH_END,   // ~30th / 31st
    ANY
}

data class TemplateItem(
    val id: Long = 0,
    val name: String,
    /** Default amount in centavos; null means variable/unset. */
    val defaultAmount: Long? = null,
    val cadence: CadenceType = CadenceType.ANY,
    val isArchived: Boolean = false
)

data class Cycle(
    val id: Long = 0,
    val title: String, // e.g. "October 15", "October 30"
    val date: String,  // YYYY-MM-DD
    /** Incoming salary in centavos. */
    val salary: Long? = null,
    val note: String? = null,
    val isClosed: Boolean = false
)

data class CycleItem(
    val id: Long = 0,
    val cycleId: Long,
    val name: String,
    /** Amount in centavos. */
    val amount: Long = 0,
    val amountExpr: String? = null, // e.g. "10538.91 + 3403"
    val isDone: Boolean = false,
    val sortOrder: Int = 0
)

data class CycleSummary(
    val cycle: Cycle,
    val items: List<CycleItem>
) {
    val totalAmount: BigDecimal get() = items.fold(BigDecimal.ZERO) { sum, item -> sum + Money.toMajor(item.amount) }
    val paidAmount: BigDecimal get() = items.filter { it.isDone }.fold(BigDecimal.ZERO) { sum, item -> sum + Money.toMajor(item.amount) }
    val remainingAmount: BigDecimal get() = totalAmount - paidAmount
    val salaryAmount: BigDecimal? get() = cycle.salary?.let { Money.toMajor(it) }
    /** Salary minus all obligations this cycle (stable when marking items Done). */
    val netRemaining: BigDecimal? get() = salaryAmount?.let { it - totalAmount }
    val missingCount: Int get() = items.count { it.amountExpr.isNullOrBlank() }
    val doneCount: Int get() = items.count { it.isDone }
    val pendingCount: Int get() = items.count { !it.isDone }
}
