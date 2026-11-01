package io.kinsena.db

import io.kinsena.domain.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.io.File
import java.time.LocalDate

class DatabaseService(dbPath: String = "data/kinsena.db") {

    init {
        val file = File(dbPath)
        file.parentFile?.mkdirs()
        Database.connect("jdbc:sqlite:$dbPath", "org.sqlite.JDBC")

        transaction {
            SchemaUtils.create(TemplateItemsTable, CyclesTable, CycleItemsTable)
            seedDefaultsIfEmpty()
        }
    }

    private fun seedDefaultsIfEmpty() {
        if (TemplateItemsTable.selectAll().count() == 0L) {
            val now = System.currentTimeMillis()
            val defaults = listOf(
                Triple("PAG-IBIG", 4820.0, CadenceType.ANY),
                Triple("DCTV", 1100.0, CadenceType.ANY),
                Triple("Beta Waters", 150.0, CadenceType.MONTH_END),
                Triple("Casureco", 1000.0, CadenceType.MONTH_END),
                Triple("Kyle", 1000.0, CadenceType.ANY),
                Triple("HOA", 300.0, CadenceType.MID_MONTH),
                Triple("BDO", null, CadenceType.ANY),
                Triple("BDO CC", null, CadenceType.ANY),
                Triple("Maya", null, CadenceType.ANY),
                Triple("Maya Landers", null, CadenceType.ANY),
                Triple("Maya Black", null, CadenceType.ANY),
                Triple("PNB", null, CadenceType.MID_MONTH),
                Triple("Lazada", null, CadenceType.ANY)
            )

            for ((name, amt, cad) in defaults) {
                TemplateItemsTable.insert {
                    it[TemplateItemsTable.name] = name
                    it[TemplateItemsTable.defaultAmount] = amt
                    it[TemplateItemsTable.cadence] = cad
                    it[TemplateItemsTable.createdAt] = now
                }
            }
        }
    }

    fun getTemplates(): List<TemplateItem> = transaction {
        TemplateItemsTable.selectAll()
            .where { TemplateItemsTable.isArchived eq false }
            .orderBy(TemplateItemsTable.name to SortOrder.ASC)
            .map {
                TemplateItem(
                    id = it[TemplateItemsTable.id],
                    name = it[TemplateItemsTable.name],
                    defaultAmount = it[TemplateItemsTable.defaultAmount],
                    cadence = it[TemplateItemsTable.cadence],
                    isArchived = it[TemplateItemsTable.isArchived]
                )
            }
    }

    fun addTemplate(name: String, defaultAmount: Double?, cadence: CadenceType) = transaction {
        val now = System.currentTimeMillis()
        TemplateItemsTable.insert {
            it[TemplateItemsTable.name] = name.trim()
            it[TemplateItemsTable.defaultAmount] = defaultAmount
            it[TemplateItemsTable.cadence] = cadence
            it[TemplateItemsTable.createdAt] = now
        }
    }

    fun getActiveCycle(): CycleSummary? = transaction {
        val cycleRow = CyclesTable.selectAll()
            .where { CyclesTable.isClosed eq false }
            .orderBy(CyclesTable.id to SortOrder.DESC)
            .limit(1)
            .singleOrNull() ?: return@transaction null

        val cycle = Cycle(
            id = cycleRow[CyclesTable.id],
            title = cycleRow[CyclesTable.title],
            date = cycleRow[CyclesTable.date],
            note = cycleRow[CyclesTable.note],
            isClosed = cycleRow[CyclesTable.isClosed]
        )

        val items = CycleItemsTable.selectAll()
            .where { CycleItemsTable.cycleId eq cycle.id }
            .orderBy(CycleItemsTable.isDone to SortOrder.ASC)
            .orderBy(CycleItemsTable.sortOrder to SortOrder.ASC)
            .orderBy(CycleItemsTable.id to SortOrder.ASC)
            .map {
                CycleItem(
                    id = it[CycleItemsTable.id],
                    cycleId = it[CycleItemsTable.cycleId],
                    name = it[CycleItemsTable.name],
                    amount = it[CycleItemsTable.amount],
                    amountExpr = it[CycleItemsTable.amountExpr],
                    isDone = it[CycleItemsTable.isDone],
                    sortOrder = it[CycleItemsTable.sortOrder]
                )
            }

        CycleSummary(cycle, items)
    }

    fun createCycle(title: String, cadence: CadenceType): Long = transaction {
        val today = LocalDate.now().toString()
        val now = System.currentTimeMillis()

        val cycleId = CyclesTable.insert {
            it[CyclesTable.title] = title.ifBlank { "Payday $today" }
            it[CyclesTable.date] = today
            it[CyclesTable.createdAt] = now
        } get CyclesTable.id

        // Populate items from templates matching the cadence
        val templates = TemplateItemsTable.selectAll()
            .where { TemplateItemsTable.isArchived eq false }
            .filter {
                val itemCad = it[TemplateItemsTable.cadence]
                itemCad == CadenceType.ANY || itemCad == cadence || cadence == CadenceType.ANY
            }

        var order = 0
        for (tmpl in templates) {
            val defAmt = tmpl[TemplateItemsTable.defaultAmount] ?: 0.0
            CycleItemsTable.insert {
                it[CycleItemsTable.cycleId] = cycleId
                it[CycleItemsTable.name] = tmpl[TemplateItemsTable.name]
                it[CycleItemsTable.amount] = defAmt
                it[CycleItemsTable.amountExpr] = if (defAmt > 0) String.format("%.2f", defAmt) else ""
                it[CycleItemsTable.isDone] = false
                it[CycleItemsTable.sortOrder] = order++
            }
        }

        cycleId
    }

    fun toggleItemDone(itemId: Long): Boolean = transaction {
        val current = CycleItemsTable.selectAll()
            .where { CycleItemsTable.id eq itemId }
            .singleOrNull()?.get(CycleItemsTable.isDone) ?: false

        val next = !current
        CycleItemsTable.update({ CycleItemsTable.id eq itemId }) {
            it[isDone] = next
        }
        next
    }

    fun updateItemAmount(itemId: Long, rawExpr: String) = transaction {
        val (parsedAmount, cleanedExpr) = AmountParser.parse(rawExpr)
        CycleItemsTable.update({ CycleItemsTable.id eq itemId }) {
            it[amount] = parsedAmount
            it[amountExpr] = cleanedExpr
        }
    }

    fun addItemToCycle(cycleId: Long, name: String, rawExpr: String) = transaction {
        val (parsedAmount, cleanedExpr) = AmountParser.parse(rawExpr)
        val maxOrder = CycleItemsTable.selectAll()
            .where { CycleItemsTable.cycleId eq cycleId }
            .maxOfOrNull { it[CycleItemsTable.sortOrder] } ?: 0

        CycleItemsTable.insert {
            it[CycleItemsTable.cycleId] = cycleId
            it[CycleItemsTable.name] = name.trim()
            it[CycleItemsTable.amount] = parsedAmount
            it[CycleItemsTable.amountExpr] = cleanedExpr
            it[CycleItemsTable.isDone] = false
            it[CycleItemsTable.sortOrder] = maxOrder + 1
        }
    }

    fun deleteItem(itemId: Long) = transaction {
        CycleItemsTable.deleteWhere { CycleItemsTable.id eq itemId }
    }

    fun closeCycle(cycleId: Long) = transaction {
        CyclesTable.update({ CyclesTable.id eq cycleId }) {
            it[isClosed] = true
        }
    }

    fun getHistory(): List<CycleSummary> = transaction {
        val cycles = CyclesTable.selectAll()
            .orderBy(CyclesTable.id to SortOrder.DESC)
            .map {
                Cycle(
                    id = it[CyclesTable.id],
                    title = it[CyclesTable.title],
                    date = it[CyclesTable.date],
                    note = it[CyclesTable.note],
                    isClosed = it[CyclesTable.isClosed]
                )
            }

        cycles.map { cycle ->
            val items = CycleItemsTable.selectAll()
                .where { CycleItemsTable.cycleId eq cycle.id }
                .orderBy(CycleItemsTable.isDone to SortOrder.ASC)
                .map {
                    CycleItem(
                        id = it[CycleItemsTable.id],
                        cycleId = it[CycleItemsTable.cycleId],
                        name = it[CycleItemsTable.name],
                        amount = it[CycleItemsTable.amount],
                        amountExpr = it[CycleItemsTable.amountExpr],
                        isDone = it[CycleItemsTable.isDone],
                        sortOrder = it[CycleItemsTable.sortOrder]
                    )
                }
            CycleSummary(cycle, items)
        }
    }
}
