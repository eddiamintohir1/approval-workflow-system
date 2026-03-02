/**
 * Document Sequence Generator Router
 *
 * Uses MySQL/TiDB (DATABASE_URL) — same database as the rest of the app.
 * Tables: doc_sequences, doc_sequence_counters (created via webdev_execute_sql)
 *
 * Format: XXXX.TYPE/COMPANY/DIVISION/MONTH_ROMAN/YEAR
 * Example: 0001.SOP/CJB/MKT/III/2026
 *
 * NOTE: Do NOT use PostgreSQL (CUSTOM_DATABASE_URL) here.
 * The AWS RDS PostgreSQL is in a private VPC and not reachable from the dev server.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

// MySQL connection pool (same DATABASE_URL as the rest of the app)
const mysqlPool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 5,
  waitForConnections: true,
});

// Constants
const DOCUMENT_TYPES = ["SOP", "IK", "FORM", "SC", "SPK", "NDA", "JPB", "BA", "SK", "RET", "SPG"] as const;
const COMPANIES = ["CJB", "CBB", "PJB"] as const;
const DIVISIONS = ["MKT", "SAL", "OPS", "PRO", "RND", "HRD", "COR", "LOG", "PUR", "FIN", "ACC", "ITS", "PRC"] as const;
const MONTHS_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const;
const STATUSES = ["draft", "review", "approved", "effective", "superseded", "obsolete"] as const;

function getMonthRoman(month: number): string {
  return MONTHS_ROMAN[month - 1];
}

export const documentSequenceRouter = router({
  // Get constants for UI dropdowns
  getConstants: protectedProcedure.query(() => ({
    documentTypes: [...DOCUMENT_TYPES],
    companies: [...COMPANIES],
    divisions: [...DIVISIONS],
    documentStatuses: [...STATUSES],
    monthsRoman: [...MONTHS_ROMAN],
  })),

  // Generate a new document number
  generateDocumentNumber: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(DOCUMENT_TYPES),
        company: z.enum(COMPANIES),
        division: z.enum(DIVISIONS),
        documentTitle: z.string().min(1).max(255),
        documentDescription: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const conn = await mysqlPool.getConnection();
      try {
        await conn.beginTransaction();

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthRoman = getMonthRoman(month);
        const counterId = `${input.documentType}-${input.company}-${input.division}-${year}`;

        // Atomic upsert: increment counter or insert with value 1
        await conn.execute(
          `INSERT INTO doc_sequence_counters (id, document_type, company, division, year, current_value, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE current_value = current_value + 1, updated_at = NOW()`,
          [counterId, input.documentType, input.company, input.division, year]
        );

        // Read the updated counter value
        const [counterRows] = await conn.execute<any[]>(
          "SELECT current_value FROM doc_sequence_counters WHERE id = ?",
          [counterId]
        );
        const seqNum: number = (counterRows as any[])[0].current_value;
        const paddedSeq = String(seqNum).padStart(4, "0");
        const documentNumber = `${paddedSeq}.${input.documentType}/${input.company}/${input.division}/${monthRoman}/${year}`;

        // Insert the document record
        const id = randomUUID();
        const changeHistory = JSON.stringify([
          { action: "created", timestamp: now.toISOString(), userId: ctx.user.id.toString() },
        ]);

        await conn.execute(
          `INSERT INTO doc_sequences
           (id, document_number, sequence_counter, document_type, company, division,
            month_roman, month_numeric, year, document_title, document_description,
            status, created_by, created_at, change_history)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NOW(), ?)`,
          [
            id, documentNumber, seqNum, input.documentType, input.company,
            input.division, monthRoman, month, year, input.documentTitle,
            input.documentDescription ?? null, ctx.user.id.toString(), changeHistory,
          ]
        );

        await conn.commit();
        return { id, documentNumber, sequenceNumber: seqNum };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }),

  // List document sequences with optional filters
  listDocumentSequences: protectedProcedure
    .input(
      z.object({
        company: z.enum(COMPANIES).optional(),
        division: z.enum(DIVISIONS).optional(),
        documentType: z.enum(DOCUMENT_TYPES).optional(),
        status: z.enum(STATUSES).optional(),
        year: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions: string[] = [];
      const params: any[] = [];

      if (input.company) { conditions.push("company = ?"); params.push(input.company); }
      if (input.division) { conditions.push("division = ?"); params.push(input.division); }
      if (input.documentType) { conditions.push("document_type = ?"); params.push(input.documentType); }
      if (input.status) { conditions.push("status = ?"); params.push(input.status); }
      if (input.year) { conditions.push("year = ?"); params.push(input.year); }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const [countRows] = await mysqlPool.execute<any[]>(
        `SELECT COUNT(*) as total FROM doc_sequences ${whereClause}`,
        params
      );
      const total = (countRows as any[])[0].total;

      const [rows] = await mysqlPool.execute<any[]>(
        `SELECT * FROM doc_sequences ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, input.limit, input.offset]
      );

      return {
        data: (rows as any[]).map((r: any) => ({
          id: r.id,
          documentNumber: r.document_number,
          sequenceCounter: r.sequence_counter,
          documentType: r.document_type,
          company: r.company,
          division: r.division,
          monthRoman: r.month_roman,
          year: r.year,
          documentTitle: r.document_title,
          documentDescription: r.document_description,
          status: r.status,
          createdBy: r.created_by,
          createdAt: r.created_at,
          changeHistory: r.change_history ? (typeof r.change_history === "string" ? JSON.parse(r.change_history) : r.change_history) : [],
        })),
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  // Search document sequences
  searchDocumentSequences: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const [rows] = await mysqlPool.execute<any[]>(
        `SELECT * FROM doc_sequences
         WHERE document_number LIKE ? OR document_title LIKE ?
         ORDER BY created_at DESC LIMIT ?`,
        [`%${input.query}%`, `%${input.query}%`, input.limit]
      );
      return (rows as any[]).map((r: any) => ({
        id: r.id,
        documentNumber: r.document_number,
        documentType: r.document_type,
        company: r.company,
        division: r.division,
        documentTitle: r.document_title,
        status: r.status,
        createdAt: r.created_at,
      }));
    }),

  // Get document sequence by ID
  getDocumentSequence: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [rows] = await mysqlPool.execute<any[]>(
        "SELECT * FROM doc_sequences WHERE id = ?",
        [input.id]
      );
      if ((rows as any[]).length === 0) throw new Error("Document sequence not found");
      const r = (rows as any[])[0];
      return {
        id: r.id,
        documentNumber: r.document_number,
        documentType: r.document_type,
        company: r.company,
        division: r.division,
        documentTitle: r.document_title,
        status: r.status,
        createdAt: r.created_at,
        changeHistory: r.change_history ? (typeof r.change_history === "string" ? JSON.parse(r.change_history) : r.change_history) : [],
      };
    }),

  // Update document status
  updateDocumentStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(STATUSES),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [existing] = await mysqlPool.execute<any[]>(
        "SELECT * FROM doc_sequences WHERE id = ?",
        [input.id]
      );
      if ((existing as any[]).length === 0) throw new Error("Document sequence not found");

      const old = (existing as any[])[0];
      const oldHistory = old.change_history
        ? (typeof old.change_history === "string" ? JSON.parse(old.change_history) : old.change_history)
        : [];
      const newHistory = JSON.stringify([
        ...oldHistory,
        {
          action: "status_updated",
          timestamp: new Date().toISOString(),
          userId: ctx.user.id.toString(),
          oldStatus: old.status,
          newStatus: input.status,
          notes: input.notes,
        },
      ]);

      await mysqlPool.execute(
        `UPDATE doc_sequences SET status = ?, updated_by = ?, updated_at = NOW(), change_history = ? WHERE id = ?`,
        [input.status, ctx.user.id.toString(), newHistory, input.id]
      );
      return { success: true };
    }),

  // Get counter statistics
  getCounterStats: protectedProcedure.query(async () => {
    const [rows] = await mysqlPool.execute<any[]>(
      "SELECT * FROM doc_sequence_counters ORDER BY created_at DESC"
    );
    return (rows as any[]).map((c: any) => ({
      id: c.id,
      documentType: c.document_type,
      company: c.company,
      division: c.division,
      year: c.year,
      currentValue: c.current_value,
    }));
  }),
});
