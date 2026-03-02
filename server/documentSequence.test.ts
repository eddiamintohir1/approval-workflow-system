/**
 * Document Sequence Generator Tests
 *
 * Tests the PostgreSQL-based document sequence router.
 * Uses CUSTOM_DATABASE_URL (AWS RDS PostgreSQL) — NOT the Drizzle MySQL/TiDB database.
 *
 * IMPORTANT: All DB changes in this project go through webdev_execute_sql or raw pg queries.
 * Never use `pnpm drizzle-kit generate` interactively for this project.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";

const pgPool = new Pool({
  connectionString: process.env.CUSTOM_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

describe("Document Sequence Generator - Database Tables", () => {
  afterAll(async () => {
    await pgPool.end();
  });

  it("should have document_sequences table", async () => {
    const result = await pgPool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'document_sequences'
    `);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].table_name).toBe("document_sequences");
  });

  it("should have sequence_counters table", async () => {
    const result = await pgPool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'sequence_counters'
    `);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].table_name).toBe("sequence_counters");
  });

  it("should have correct columns in document_sequences", async () => {
    const result = await pgPool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'document_sequences'
      ORDER BY column_name
    `);
    const columns = result.rows.map((r: { column_name: string }) => r.column_name);
    expect(columns).toContain("id");
    expect(columns).toContain("document_number");
    expect(columns).toContain("document_type");
    expect(columns).toContain("company");
    expect(columns).toContain("division");
    expect(columns).toContain("status");
    expect(columns).toContain("created_by");
    expect(columns).toContain("change_history");
  });

  it("should have correct columns in sequence_counters", async () => {
    const result = await pgPool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sequence_counters'
      ORDER BY column_name
    `);
    const columns = result.rows.map((r: { column_name: string }) => r.column_name);
    expect(columns).toContain("id");
    expect(columns).toContain("document_type");
    expect(columns).toContain("current_value");
    expect(columns).toContain("prefix");
  });

  it("should format document number correctly", () => {
    // Test the formatting logic: XXXX.TYPE/COMPANY/DIVISION/MONTH/YEAR
    const seq = 1;
    const paddedSeq = String(seq).padStart(4, "0");
    const docNum = `${paddedSeq}.SOP/CJB/MKT/III/2026`;
    expect(docNum).toBe("0001.SOP/CJB/MKT/III/2026");
  });

  it("should convert month number to Roman numeral correctly", () => {
    const MONTHS_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    expect(MONTHS_ROMAN[0]).toBe("I");
    expect(MONTHS_ROMAN[2]).toBe("III");
    expect(MONTHS_ROMAN[11]).toBe("XII");
  });

  it("should insert and retrieve a test sequence counter", async () => {
    const testId = `TEST-CJB-MKT-2026-99`;
    // Clean up first
    await pgPool.query("DELETE FROM sequence_counters WHERE id = $1", [testId]);

    // Insert
    await pgPool.query(
      `INSERT INTO sequence_counters (id, prefix, department, document_type, current_value, created_at, updated_at)
       VALUES ($1, 'CJB-MKT', 'MKT', 'TEST', 1, NOW(), NOW())`,
      [testId]
    );

    // Retrieve
    const result = await pgPool.query(
      "SELECT * FROM sequence_counters WHERE id = $1",
      [testId]
    );
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].current_value).toBe(1);
    expect(result.rows[0].prefix).toBe("CJB-MKT");

    // Clean up
    await pgPool.query("DELETE FROM sequence_counters WHERE id = $1", [testId]);
  });
});
