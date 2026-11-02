package io.kinsena.db

import java.nio.file.Files
import java.sql.DriverManager
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class MoneyMigrationTest {
    @Test fun upgradesLegacyRealPesoColumnsToCentavosOnce() {
        val dbPath = Files.createTempDirectory("kinsena-migrate").resolve("legacy.db").toString()
        DriverManager.getConnection("jdbc:sqlite:$dbPath").use { conn ->
            conn.createStatement().use { st ->
                st.execute(
                    """
                    CREATE TABLE template_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name VARCHAR(128) NOT NULL,
                        default_amount DOUBLE NULL,
                        cadence VARCHAR(32) DEFAULT 'ANY' NOT NULL,
                        is_archived BOOLEAN DEFAULT 0 NOT NULL,
                        created_at BIGINT NOT NULL
                    )
                    """.trimIndent()
                )
                st.execute(
                    """
                    CREATE TABLE cycles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title VARCHAR(128) NOT NULL,
                        date VARCHAR(32) NOT NULL,
                        salary DOUBLE NULL,
                        note TEXT NULL,
                        is_closed BOOLEAN DEFAULT 0 NOT NULL,
                        created_at BIGINT NOT NULL
                    )
                    """.trimIndent()
                )
                st.execute(
                    """
                    CREATE TABLE cycle_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        cycle_id BIGINT NOT NULL,
                        name VARCHAR(128) NOT NULL,
                        amount DOUBLE DEFAULT 0 NOT NULL,
                        amount_expr VARCHAR(256) NULL,
                        is_done BOOLEAN DEFAULT 0 NOT NULL,
                        sort_order INT DEFAULT 0 NOT NULL
                    )
                    """.trimIndent()
                )
                st.execute("INSERT INTO template_items (name, default_amount, cadence, is_archived, created_at) VALUES ('Rent', 18500.50, 'ANY', 0, 1)")
                st.execute("INSERT INTO template_items (name, default_amount, cadence, is_archived, created_at) VALUES ('Variable', NULL, 'ANY', 0, 1)")
                st.execute("INSERT INTO cycles (title, date, salary, is_closed, created_at) VALUES ('October 15', '2026-10-15', 75000.0, 0, 1)")
                st.execute("INSERT INTO cycle_items (cycle_id, name, amount, amount_expr, is_done, sort_order) VALUES (1, 'Rent', 18500.50, '18500.50', 0, 0)")
            }
        }

        val db = DatabaseService(dbPath)
        assertEquals(1_850_050L, db.getTemplates().single { it.name == "Rent" }.defaultAmount)
        assertEquals(null, db.getTemplates().single { it.name == "Variable" }.defaultAmount)
        val cycle = db.getActiveCycle()!!
        assertEquals(7_500_000L, cycle.cycle.salary)
        assertEquals(1_850_050L, cycle.items.single().amount)
        assertEquals("18500.50", cycle.totalAmount.toPlainString())
        assertEquals("56499.50", cycle.netRemaining!!.toPlainString())

        // Second open must not multiply again
        val again = DatabaseService(dbPath)
        assertEquals(1_850_050L, again.getTemplates().single { it.name == "Rent" }.defaultAmount)
        assertEquals(7_500_000L, again.getActiveCycle()!!.cycle.salary)

        DriverManager.getConnection("jdbc:sqlite:$dbPath").use { conn ->
            conn.createStatement().use { st ->
                val rs = st.executeQuery("PRAGMA table_info(cycle_items)")
                var amountType = ""
                while (rs.next()) {
                    if (rs.getString("name") == "amount") amountType = rs.getString("type")
                }
                assertFalse(amountType.uppercase().contains("DOUBLE"))
                assertFalse(amountType.uppercase().contains("REAL"))
                assertFalse(amountType.uppercase().contains("FLOAT"))
            }
        }
    }
}
