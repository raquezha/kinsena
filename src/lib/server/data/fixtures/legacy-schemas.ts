// Schemas exactly as Kinsena 0.1 (Kotlin/Exposed) created them, for migration tests.

/** The centavos schema written by Kinsena 0.1.0. */
export const KINSENA_0_1_SCHEMA = `
CREATE TABLE template_items (id INTEGER PRIMARY KEY AUTOINCREMENT, "name" VARCHAR(128) NOT NULL,
  default_amount BIGINT NULL, cadence VARCHAR(32) DEFAULT 'ANY' NOT NULL,
  is_archived BOOLEAN DEFAULT 0 NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE cycles (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(128) NOT NULL,
  "date" VARCHAR(32) NOT NULL, salary BIGINT NULL, note TEXT NULL,
  is_closed BOOLEAN DEFAULT 0 NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE cycle_items (id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id BIGINT NOT NULL,
  "name" VARCHAR(128) NOT NULL, amount BIGINT DEFAULT 0 NOT NULL, amount_expr VARCHAR(256) NULL,
  is_done BOOLEAN DEFAULT 0 NOT NULL, sort_order INT DEFAULT 0 NOT NULL,
  CONSTRAINT fk_cycle_items_cycle_id__id FOREIGN KEY (cycle_id) REFERENCES cycles(id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_cycle_items_signed_integer_sort_order
    CHECK (sort_order BETWEEN -2147483648 AND 2147483647));
CREATE TABLE settings (id INT NOT NULL PRIMARY KEY, currency VARCHAR(3) DEFAULT 'PHP' NOT NULL,
  CONSTRAINT chk_settings_signed_integer_id CHECK (id BETWEEN -2147483648 AND 2147483647));
INSERT INTO settings (id, currency) VALUES (1, 'USD');
INSERT INTO template_items (name, default_amount, cadence, is_archived, created_at)
  VALUES ('Rent', 1850050, 'ANY', 0, 1), ('Old gym', 99900, 'ANY', 1, 1);
INSERT INTO cycles (title, date, salary, note, is_closed, created_at)
  VALUES ('September 30', '2026-09-30', 7500000, 'Bonus payout', 1, 1),
         ('October 15', '2026-10-15', NULL, NULL, 0, 2);
INSERT INTO cycle_items (cycle_id, name, amount, amount_expr, is_done, sort_order)
  VALUES (1, 'Rent', 1850050, '18500.50', 1, 0), (2, 'Electric', 0, '', 0, 0);
`;

/** The earliest schema, which stored pesos as DOUBLE. */
export const LEGACY_REAL_SCHEMA = `
CREATE TABLE template_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(128) NOT NULL,
  default_amount DOUBLE NULL, cadence VARCHAR(32) DEFAULT 'ANY' NOT NULL,
  is_archived BOOLEAN DEFAULT 0 NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE cycles (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(128) NOT NULL,
  date VARCHAR(32) NOT NULL, salary DOUBLE NULL, note TEXT NULL,
  is_closed BOOLEAN DEFAULT 0 NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE cycle_items (id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id BIGINT NOT NULL,
  name VARCHAR(128) NOT NULL, amount DOUBLE DEFAULT 0 NOT NULL, amount_expr VARCHAR(256) NULL,
  is_done BOOLEAN DEFAULT 0 NOT NULL, sort_order INT DEFAULT 0 NOT NULL);
INSERT INTO template_items (name, default_amount, cadence, is_archived, created_at)
  VALUES ('Rent', 18500.50, 'ANY', 0, 1), ('Variable', NULL, 'ANY', 0, 1);
INSERT INTO cycles (title, date, salary, is_closed, created_at)
  VALUES ('October 15', '2026-10-15', 75000.0, 0, 1);
INSERT INTO cycle_items (cycle_id, name, amount, amount_expr, is_done, sort_order)
  VALUES (1, 'Rent', 18500.50, '18500.50', 0, 0);
`;
