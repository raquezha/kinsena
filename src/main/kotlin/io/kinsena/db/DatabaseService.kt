package io.kinsena.db

import io.kinsena.domain.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.TransactionManager
import org.jetbrains.exposed.sql.transactions.transaction
import java.io.File
import java.sql.Connection
import java.time.LocalDate

class DatabaseService(dbPath: String = "data/kinsena.db") {

    init {
        val file = File(dbPath)
        file.parentFile?.mkdirs()
        Database.connect("jdbc:sqlite:$dbPath", "org.sqlite.JDBC")

        transaction {
            SchemaUtils.create(TemplateItemsTable, CyclesTable, CycleItemsTable, SettingsTable)
            SettingsTable.insertIgnore { it[id] = 1 }
            migrateMoneyToCentavosIfNeeded()
        }
    }

    private fun requireMoney(cents: Long?, label: String = "amount") {
        require(cents == null || (cents in 0L..999_999_999_999_99L)) { "Invalid $label" }
    }

    /** True when a money column was created as REAL/DOUBLE pesos (pre-centavos schema). */
    private fun columnIsFloatingMoney(table: String, column: String): Boolean {
        var floating = false
        TransactionManager.current().exec("PRAGMA table_info($table)") { rs ->
            while (rs.next()) {
                if (rs.getString("name") == column) {
                    val type = rs.getString("type").orEmpty().uppercase()
                    floating = type.contains("REAL") || type.contains("DOUBLE") || type.contains("FLOAT")
                }
            }
        }
        return floating
    }

    /** Run non-query SQL via JDBC (Exposed exec uses executeQuery and fails for DDL/PRAGMA). */
    private fun execDdl(sql: String) {
        val jdbc = TransactionManager.current().connection.connection as Connection
        jdbc.createStatement().use { it.execute(sql) }
    }

    /**
     * One-shot upgrade: convert peso REAL columns to BIGINT centavos.
     * Fresh DBs created with Exposed long() already use BIGINT and skip this.
     */
    private fun migrateMoneyToCentavosIfNeeded() {
        val templatesNeed = columnIsFloatingMoney("template_items", "default_amount")
        val cyclesNeed = columnIsFloatingMoney("cycles", "salary")
        val itemsNeed = columnIsFloatingMoney("cycle_items", "amount")
        if (!templatesNeed && !cyclesNeed && !itemsNeed) return

        execDdl("PRAGMA foreign_keys=OFF")
        if (templatesNeed) {
            execDdl(
                """
                CREATE TABLE template_items_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(128) NOT NULL,
                    default_amount BIGINT NULL,
                    cadence VARCHAR(32) DEFAULT 'ANY' NOT NULL,
                    is_archived BOOLEAN DEFAULT 0 NOT NULL,
                    created_at BIGINT NOT NULL
                )
                """.trimIndent()
            )
            execDdl(
                """
                INSERT INTO template_items_new (id, name, default_amount, cadence, is_archived, created_at)
                SELECT id, name,
                    CASE WHEN default_amount IS NULL THEN NULL
                         ELSE CAST(ROUND(default_amount * 100) AS INTEGER) END,
                    cadence, is_archived, created_at
                FROM template_items
                """.trimIndent()
            )
            execDdl("DROP TABLE template_items")
            execDdl("ALTER TABLE template_items_new RENAME TO template_items")
        }
        if (cyclesNeed) {
            execDdl(
                """
                CREATE TABLE cycles_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR(128) NOT NULL,
                    date VARCHAR(32) NOT NULL,
                    salary BIGINT NULL,
                    note TEXT NULL,
                    is_closed BOOLEAN DEFAULT 0 NOT NULL,
                    created_at BIGINT NOT NULL
                )
                """.trimIndent()
            )
            execDdl(
                """
                INSERT INTO cycles_new (id, title, date, salary, note, is_closed, created_at)
                SELECT id, title, date,
                    CASE WHEN salary IS NULL THEN NULL
                         ELSE CAST(ROUND(salary * 100) AS INTEGER) END,
                    note, is_closed, created_at
                FROM cycles
                """.trimIndent()
            )
            execDdl("DROP TABLE cycles")
            execDdl("ALTER TABLE cycles_new RENAME TO cycles")
        }
        if (itemsNeed) {
            execDdl(
                """
                CREATE TABLE cycle_items_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cycle_id BIGINT NOT NULL,
                    name VARCHAR(128) NOT NULL,
                    amount BIGINT DEFAULT 0 NOT NULL,
                    amount_expr VARCHAR(256) NULL,
                    is_done BOOLEAN DEFAULT 0 NOT NULL,
                    sort_order INT DEFAULT 0 NOT NULL,
                    FOREIGN KEY (cycle_id) REFERENCES cycles(id)
                )
                """.trimIndent()
            )
            execDdl(
                """
                INSERT INTO cycle_items_new (id, cycle_id, name, amount, amount_expr, is_done, sort_order)
                SELECT id, cycle_id, name,
                    CAST(ROUND(amount * 100) AS INTEGER),
                    amount_expr, is_done, sort_order
                FROM cycle_items
                """.trimIndent()
            )
            execDdl("DROP TABLE cycle_items")
            execDdl("ALTER TABLE cycle_items_new RENAME TO cycle_items")
        }
        execDdl("PRAGMA foreign_keys=ON")
    }

    fun getCurrency(): Currency = transaction {
        SettingsTable.selectAll().where { SettingsTable.id eq 1 }.single()[SettingsTable.currency]
    }

    fun updateCurrency(currency: Currency) = transaction {
        SettingsTable.update({ SettingsTable.id eq 1 }) { it[SettingsTable.currency] = currency }
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

    fun addTemplate(name: String, defaultAmount: Long?, cadence: CadenceType) = transaction {
        require(name.isNotBlank() && name.trim().length <= 128) { "Enter a name up to 128 characters" }
        requireMoney(defaultAmount, "default amount")
        val now = System.currentTimeMillis()
        TemplateItemsTable.insert {
            it[TemplateItemsTable.name] = name.trim()
            it[TemplateItemsTable.defaultAmount] = defaultAmount
            it[TemplateItemsTable.cadence] = cadence
            it[TemplateItemsTable.createdAt] = now
        }
    }

    fun updateTemplateAmount(id: Long, amount: Long?) = transaction {
        requireMoney(amount, "default amount")
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

    fun createCycle(title: String, cadence: CadenceType, salary: Long? = null): Long = transaction {
        require(title.length <= 128) { "Title is too long" }
        requireMoney(salary, "salary")
        require(CyclesTable.selectAll().where { CyclesTable.isClosed eq false }.empty()) { "Finish the current cycle first" }
        val today = LocalDate.now().toString()
        val now = System.currentTimeMillis()

        val cycleId = CyclesTable.insert {
            it[CyclesTable.title] = title.ifBlank { "Payday $today" }
            it[CyclesTable.date] = today
            it[CyclesTable.salary] = salary
            it[CyclesTable.createdAt] = now
        } get CyclesTable.id

        val templates = TemplateItemsTable.selectAll()
            .where { TemplateItemsTable.isArchived eq false }
            .filter {
                val itemCad = it[TemplateItemsTable.cadence]
                itemCad == CadenceType.ANY || itemCad == cadence || cadence == CadenceType.ANY
            }

        var order = 0
        for (tmpl in templates) {
            val defAmt = tmpl[TemplateItemsTable.defaultAmount] ?: 0L
            CycleItemsTable.insert {
                it[CycleItemsTable.cycleId] = cycleId
                it[CycleItemsTable.name] = tmpl[TemplateItemsTable.name]
                it[CycleItemsTable.amount] = defAmt
                it[CycleItemsTable.amountExpr] = tmpl[TemplateItemsTable.defaultAmount]?.let { Money.formatEdit(it) } ?: ""
                it[CycleItemsTable.isDone] = false
                it[CycleItemsTable.sortOrder] = order++
            }
        }

        cycleId
    }

    fun updateCycleSalary(cycleId: Long, salary: Long?) = transaction {
        requireMoney(salary, "salary")
        require(CyclesTable.selectAll().where { (CyclesTable.id eq cycleId) and (CyclesTable.isClosed eq false) }.count() == 1L) { "Cycle is closed" }
        CyclesTable.update({ CyclesTable.id eq cycleId }) {
            it[CyclesTable.salary] = salary
        }
    }

    fun updateCycleNote(cycleId: Long, note: String?) = transaction {
        val cleaned = note?.trim()?.takeIf { it.isNotEmpty() }
        require(cleaned == null || cleaned.length <= 280) { "Keep the note under 280 characters" }
        require(CyclesTable.update({ (CyclesTable.id eq cycleId) and (CyclesTable.isClosed eq false) }) {
            it[CyclesTable.note] = cleaned
        } == 1) { "Cycle is closed" }
    }

    private fun requireActiveItem(itemId: Long) {
        val cycleId = CycleItemsTable.selectAll().where { CycleItemsTable.id eq itemId }
            .singleOrNull()?.get(CycleItemsTable.cycleId)
        require(cycleId != null && CyclesTable.selectAll()
            .where { (CyclesTable.id eq cycleId) and (CyclesTable.isClosed eq false) }.count() == 1L) {
            "Item is not in the active cycle"
        }
    }

    /** Returns true when the item was just marked paid. */
    fun toggleItemDone(itemId: Long): Boolean = transaction {
        requireActiveItem(itemId)
        val current = CycleItemsTable.selectAll().where { CycleItemsTable.id eq itemId }
            .single()[CycleItemsTable.isDone]
        CycleItemsTable.update({ CycleItemsTable.id eq itemId }) { it[isDone] = !current }
        !current
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
