/**
 * Document Sequence Generator Router
 *
 * Uses MySQL/TiDB (DATABASE_URL) — same database as the rest of the app.
 * Tables: doc_sequences, doc_sequence_counters (created via webdev_execute_sql)
 *
 * Format: XXXX.TYPE/COMPANY/DIVISION/MONTH_ROMAN/YEAR  (for non-PKWT)
 *         NNN/PKWT/COMPANY/DIVISION/MONTH_ROMAN/YEAR   (for PKWT — legacy format)
 * Example: 0001.SOP/CJB/MKT/III/2026
 *          012/PKWT/CJB/HRD/V/2026
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

// Constants — PKWT added for HR employment contracts
const DOCUMENT_TYPES = ["SOP", "IK", "FORM", "SC", "SPK", "NDA", "JPB", "BA", "SK", "RET", "SPG", "PKWT"] as const;
const COMPANIES = ["CJB", "CBB", "PJB"] as const;
const DIVISIONS = ["MKT", "SAL", "OPS", "PRO", "RND", "HRD", "COR", "LOG", "PUR", "FIN", "ACC", "ITS", "PRC"] as const;
const MONTHS_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const;
const STATUSES = ["draft", "review", "approved", "effective", "superseded", "obsolete"] as const;

function getMonthRoman(month: number): string {
  return MONTHS_ROMAN[month - 1];
}

function mapRow(r: any) {
  return {
    id: r.id,
    documentNumber: r.document_number,
    sequenceCounter: r.sequence_counter,
    documentType: r.document_type,
    company: r.company,
    division: r.division,
    monthRoman: r.month_roman,
    monthNumeric: r.month_numeric,
    year: r.year,
    documentTitle: r.document_title,
    recipientName: r.recipient_name ?? null,
    documentDescription: r.document_description,
    status: r.status,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? null,
    changeHistory: r.change_history
      ? typeof r.change_history === "string"
        ? JSON.parse(r.change_history)
        : r.change_history
      : [],
  };
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
        recipientName: z.string().max(255).optional(),
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

        // Build document number — PKWT uses legacy format NNN/PKWT/COMPANY/DIVISION/MONTH/YEAR
        let documentNumber: string;
        if (input.documentType === "PKWT") {
          const paddedSeq = String(seqNum).padStart(3, "0");
          documentNumber = `${paddedSeq}/${input.documentType}/${input.company}/${input.division}/${monthRoman}/${year}`;
        } else {
          const paddedSeq = String(seqNum).padStart(4, "0");
          documentNumber = `${paddedSeq}.${input.documentType}/${input.company}/${input.division}/${monthRoman}/${year}`;
        }

        // Insert the document record
        const id = randomUUID();
        const changeHistory = JSON.stringify([
          { action: "created", timestamp: now.toISOString(), userId: ctx.user.id.toString() },
        ]);

        await conn.execute(
          `INSERT INTO doc_sequences
           (id, document_number, sequence_counter, document_type, company, division,
            month_roman, month_numeric, year, document_title, recipient_name, document_description,
            status, created_by, created_at, change_history)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NOW(), ?)`,
          [
            id, documentNumber, seqNum, input.documentType, input.company,
            input.division, monthRoman, month, year, input.documentTitle,
            input.recipientName ?? null,
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

  // List document sequences with optional filters + pagination
  listDocumentSequences: protectedProcedure
    .input(
      z.object({
        company: z.enum(COMPANIES).optional(),
        division: z.enum(DIVISIONS).optional(),
        documentType: z.enum(DOCUMENT_TYPES).optional(),
        status: z.enum(STATUSES).optional(),
        year: z.number().int().min(2000).max(2100).optional(),
        limit: z.number().int().min(1).max(200).default(20),
        offset: z.number().int().min(0).default(0),
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
      const total = Number((countRows as any[])[0].total);

      // Interpolate integers directly — mysql2 prepared statements don't accept LIMIT/OFFSET params
      const limitVal = Math.max(1, Math.min(200, Math.floor(Number(input.limit))));
      const offsetVal = Math.max(0, Math.floor(Number(input.offset)));
      const [rows] = await mysqlPool.execute<any[]>(
        `SELECT * FROM doc_sequences ${whereClause} ORDER BY created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`,
        params
      );

      return {
        data: (rows as any[]).map(mapRow),
        total,
        limit: limitVal,
        offset: offsetVal,
        totalPages: Math.ceil(total / limitVal),
        currentPage: Math.floor(offsetVal / limitVal) + 1,
      };
    }),

  // Search document sequences
  searchDocumentSequences: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const limitVal = Math.max(1, Math.min(100, Math.floor(Number(input.limit))));
      const [rows] = await mysqlPool.execute<any[]>(
        `SELECT * FROM doc_sequences
         WHERE document_number LIKE ? OR document_title LIKE ? OR recipient_name LIKE ?
         ORDER BY created_at DESC LIMIT ${limitVal}`,
        [`%${input.query}%`, `%${input.query}%`, `%${input.query}%`]
      );
      return (rows as any[]).map(mapRow);
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
      return mapRow((rows as any[])[0]);
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
          notes: input.notes ?? null,
        },
      ]);

      await mysqlPool.execute(
        `UPDATE doc_sequences SET status = ?, updated_by = ?, updated_at = NOW(), change_history = ? WHERE id = ?`,
        [input.status, ctx.user.id.toString(), newHistory, input.id]
      );
      return { success: true, newStatus: input.status };
    }),

  // Get counter statistics
  getCounterStats: protectedProcedure.query(async () => {
    const [rows] = await mysqlPool.execute<any[]>(
      "SELECT * FROM doc_sequence_counters ORDER BY year DESC, document_type ASC"
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

  // Get available years for filter dropdown
  getAvailableYears: protectedProcedure.query(async () => {
    const [rows] = await mysqlPool.execute<any[]>(
      "SELECT DISTINCT year FROM doc_sequences ORDER BY year DESC"
    );
    return (rows as any[]).map((r: any) => r.year as number);
  }),
});
