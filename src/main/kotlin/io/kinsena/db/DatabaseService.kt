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
        require(name.isNotBlank() && name.trim().length <= 128) { "Enter a name up to 128 characters" }
        require(defaultAmount == null || (defaultAmount.isFinite() && defaultAmount >= 0 && defaultAmount <= 999999999999.99)) { "Invalid default amount" }
        val now = System.currentTimeMillis()
        TemplateItemsTable.insert {
            it[TemplateItemsTable.name] = name.trim()
            it[TemplateItemsTable.defaultAmount] = defaultAmount
            it[TemplateItemsTable.cadence] = cadence
            it[TemplateItemsTable.createdAt] = now
        }
    }

    fun updateTemplateAmount(id: Long, amount: Double?) = transaction {
        require(amount == null || (amount.isFinite() && amount >= 0 && amount <= 999999999999.99)) { "Invalid default amount" }
        require(TemplateItemsTable.update({ (TemplateItemsTable.id eq id) and (TemplateItemsTable.isArchived eq false) }) {
            it[TemplateItemsTable.defaultAmount] = amount
        } == 1) { "Unknown saved item" }
    }

    fun archiveTemplate(id: Long) = transaction {
        require(TemplateItemsTable.update({ TemplateItemsTable.id eq id }) { it[isArchived] = true } == 1) { "Unknown saved item" }
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
            salary = cycleRow[CyclesTable.salary],
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

    fun createCycle(title: String, cadence: CadenceType, salary: Double? = null): Long = transaction {
        require(title.length <= 128) { "Title is too long" }
        require(salary == null || (salary.isFinite() && salary >= 0 && salary <= 999999999999.99)) { "Invalid salary" }
        require(CyclesTable.selectAll().where { CyclesTable.isClosed eq false }.empty()) { "Finish the current cycle first" }
        val today = LocalDate.now().toString()
        val now = System.currentTimeMillis()

        val cycleId = CyclesTable.insert {
            it[CyclesTable.title] = title.ifBlank { "Payday $today" }
            it[CyclesTable.date] = today
            it[CyclesTable.salary] = salary
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
                it[CycleItemsTable.amountExpr] = tmpl[TemplateItemsTable.defaultAmount]?.toString() ?: ""
                it[CycleItemsTable.isDone] = false
                it[CycleItemsTable.sortOrder] = order++
            }
        }

        cycleId
    }

    fun updateCycleSalary(cycleId: Long, salary: Double?) = transaction {
        require(salary == null || (salary.isFinite() && salary >= 0 && salary <= 999999999999.99)) { "Invalid salary" }
        require(CyclesTable.selectAll().where { (CyclesTable.id eq cycleId) and (CyclesTable.isClosed eq false) }.count() == 1L) { "Cycle is closed" }
        CyclesTable.update({ CyclesTable.id eq cycleId }) {
            it[CyclesTable.salary] = salary
        }
    }

    private fun requireActiveItem(itemId: Long) {
        val cycleId = CycleItemsTable.selectAll().where { CycleItemsTable.id eq itemId }
            .singleOrNull()?.get(CycleItemsTable.cycleId)
        require(cycleId != null && CyclesTable.selectAll()
            .where { (CyclesTable.id eq cycleId) and (CyclesTable.isClosed eq false) }.count() == 1L) {
            "Item is not in the active cycle"
        }
    }

    fun toggleItemDone(itemId: Long) = transaction {
        requireActiveItem(itemId)
        val current = CycleItemsTable.selectAll().where { CycleItemsTable.id eq itemId }
            .single()[CycleItemsTable.isDone]
        CycleItemsTable.update({ CycleItemsTable.id eq itemId }) { it[isDone] = !current }
    }

    fun updateItemAmount(itemId: Long, rawExpr: String) = transaction {
        requireActiveItem(itemId)
        val (parsedAmount, cleanedExpr) = AmountParser.parse(rawExpr)
        CycleItemsTable.update({ CycleItemsTable.id eq itemId }) {
            it[amount] = parsedAmount
            it[amountExpr] = cleanedExpr
        }
    }

    fun addItemToCycle(cycleId: Long, name: String, rawExpr: String) = transaction {
        require(name.isNotBlank() && name.trim().length <= 128) { "Enter a name up to 128 characters" }
        require(CyclesTable.selectAll().where { (CyclesTable.id eq cycleId) and (CyclesTable.isClosed eq false) }.count() == 1L) { "Cycle is closed" }
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
        requireActiveItem(itemId)
        CycleItemsTable.deleteWhere { CycleItemsTable.id eq itemId }
    }

    fun closeCycle(cycleId: Long) = transaction {
        require(CyclesTable.selectAll().where { (CyclesTable.id eq cycleId) and (CyclesTable.isClosed eq false) }.count() == 1L) { "Cycle is already closed" }
        CyclesTable.update({ CyclesTable.id eq cycleId }) {
            it[isClosed] = true
        }
    }

    fun reopenCycle(cycleId: Long) = transaction {
        require(CyclesTable.selectAll().where { CyclesTable.isClosed eq false }.empty()) { "Finish the current cycle first" }
        val latest = CyclesTable.selectAll().orderBy(CyclesTable.id to SortOrder.DESC).limit(1).singleOrNull()
        require(latest != null && latest[CyclesTable.id] == cycleId && latest[CyclesTable.isClosed]) {
            "Only the most recent finished cycle can be reopened"
        }
        CyclesTable.update({ CyclesTable.id eq cycleId }) { it[isClosed] = false }
    }

    fun getHistory(): List<CycleSummary> = transaction {
        val cycles = CyclesTable.selectAll()
            .orderBy(CyclesTable.id to SortOrder.DESC)
            .map {
                Cycle(
                    id = it[CyclesTable.id],
                    title = it[CyclesTable.title],
                    date = it[CyclesTable.date],
                    salary = it[CyclesTable.salary],
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
