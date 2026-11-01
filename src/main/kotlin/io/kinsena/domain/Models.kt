package io.kinsena.domain

import kotlinx.serialization.Serializable

@Serializable
enum class CadenceType {
    MID_MONTH,   // ~15th
    MONTH_END,   // ~30th / 31st
    ANY
}

@Serializable
data class TemplateItem(
    val id: Long = 0,
    val name: String,
    val defaultAmount: Double? = null,
    val cadence: CadenceType = CadenceType.ANY,
    val isArchived: Boolean = false
)

@Serializable
data class Cycle(
    val id: Long = 0,
    val title: String, // e.g. "October 15", "October 30"
    val date: String,  // YYYY-MM-DD
    val note: String? = null,
    val isClosed: Boolean = false
)

@Serializable
data class CycleItem(
    val id: Long = 0,
    val cycleId: Long,
    val name: String,
    val amount: Double = 0.0,
    val amountExpr: String? = null, // e.g. "10538.91 + 3403"
    val isDone: Boolean = false,
    val sortOrder: Int = 0
)

data class CycleSummary(
    val cycle: Cycle,
    val items: List<CycleItem>
) {
    val totalAmount: Double get() = items.sumOf { it.amount }
    val paidAmount: Double get() = items.filter { it.isDone }.sumOf { it.amount }
    val remainingAmount: Double get() = totalAmount - paidAmount
    val doneCount: Int get() = items.count { it.isDone }
    val pendingCount: Int get() = items.count { !it.isDone }
}
