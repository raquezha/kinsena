package io.kinsena.db

import io.kinsena.domain.CadenceType
import org.jetbrains.exposed.sql.Table

object TemplateItemsTable : Table("template_items") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 128)
    val defaultAmount = double("default_amount").nullable()
    val cadence = enumerationByName("cadence", 32, CadenceType::class).default(CadenceType.ANY)
    val isArchived = bool("is_archived").default(false)
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}

object CyclesTable : Table("cycles") {
    val id = long("id").autoIncrement()
    val title = varchar("title", 128)
    val date = varchar("date", 32)
    val salary = double("salary").nullable()
    val note = text("note").nullable()
    val isClosed = bool("is_closed").default(false)
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}

object CycleItemsTable : Table("cycle_items") {
    val id = long("id").autoIncrement()
    val cycleId = long("cycle_id").references(CyclesTable.id)
    val name = varchar("name", 128)
    val amount = double("amount").default(0.0)
    val amountExpr = varchar("amount_expr", 256).nullable()
    val isDone = bool("is_done").default(false)
    val sortOrder = integer("sort_order").default(0)

    override val primaryKey = PrimaryKey(id)
}
