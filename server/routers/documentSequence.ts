/**
 * Document Sequence Generator Router
 *
 * Uses raw pg Pool queries against CUSTOM_DATABASE_URL (Azure PostgreSQL).
 * Do NOT use Drizzle ORM here — the document_sequences and sequence_counters
 * tables live in PostgreSQL, while the main Drizzle schema targets MySQL/TiDB.
 *
 * Database migration was applied via webdev_execute_sql (see obsidian-vault/06-Database/Migrations.md).
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

// PostgreSQL pool for document sequences (Azure Database for PostgreSQL)
const pgPool = new Pool({
  connectionString: process.env.CUSTOM_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

// Constants
const DOCUMENT_TYPES = [
  "SOP",
  "IK",
  "FORM",
  "SC",
  "SPK",
  "NDA",
  "JPB",
  "BA",
  "SK",
  "RET",
  "SPG",
] as const;
const COMPANIES = ["CJB", "CBB", "PJB"] as const;
const DIVISIONS = [
  "MKT",
  "SAL",
  "OPS",
  "PRO",
  "RND",
  "HRD",
  "COR",
  "LOG",
  "PUR",
  "FIN",
  "ACC",
  "ITS",
  "PRC",
] as const;
const MONTHS_ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

function getMonthRoman(monthNum: number): string {
  if (monthNum < 1 || monthNum > 12) throw new Error("Invalid month number");
  return MONTHS_ROMAN[monthNum - 1];
}

async function getNextSequenceNumber(
  documentType: string,
  company: string,
  division: string,
  year: number,
  monthNumeric: number
): Promise<number> {
  const counterId = `${documentType}-${company}-${division}-${year}-${monthNumeric}`;
  const client = await pgPool.connect();
  try {
    // Check if counter exists
    const existing = await client.query(
      "SELECT current_value FROM sequence_counters WHERE id = $1",
      [counterId]
    );

    if (existing.rows.length > 0) {
      const nextValue = (existing.rows[0].current_value || 0) + 1;
      await client.query(
        "UPDATE sequence_counters SET current_value = $1, updated_at = NOW() WHERE id = $2",
        [nextValue, counterId]
      );
      return nextValue;
    } else {
      await client.query(
        `INSERT INTO sequence_counters (id, prefix, department, document_type, current_value, format_pattern, reset_period, last_reset_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 1, $5, 'monthly', NOW(), NOW(), NOW())`,
        [
          counterId,
          `${company}-${division}`,
          division,
          documentType,
          `XXXX.${documentType}/${company}/${division}/MM/YYYY`,
        ]
      );
      return 1;
    }
  } finally {
    client.release();
  }
}

function formatDocumentNumber(
  sequenceNum: number,
  documentType: string,
  company: string,
  division: string,
  monthRoman: string,
  year: number
): string {
  const paddedSeq = String(sequenceNum).padStart(4, "0");
  return `${paddedSeq}.${documentType}/${company}/${division}/${monthRoman}/${year}`;
}

export const documentSequenceRouter = router({
  // Generate a new document sequence number
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
      const now = new Date();
      const year = now.getFullYear();
      const monthNumeric = now.getMonth() + 1;
      const monthRoman = getMonthRoman(monthNumeric);

      const sequenceNum = await getNextSequenceNumber(
        input.documentType,
        input.company,
        input.division,
        year,
        monthNumeric
      );

      const documentNumber = formatDocumentNumber(
        sequenceNum,
        input.documentType,
        input.company,
        input.division,
        monthRoman,
        year
      );

      const id = uuidv4();
      const userId = ctx.user.id.toString();
      const changeHistory = JSON.stringify([
        {
          action: "created",
          timestamp: now.toISOString(),
          userId,
          changes: "Document sequence generated",
        },
      ]);

      const client = await pgPool.connect();
      try {
        await client.query(
          `INSERT INTO document_sequences
            (id, document_number, sequence_counter, document_type, company, division,
             month_roman, month_numeric, year, revision_number, document_title,
             document_description, status, created_by, created_at, change_history)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,'draft',$12,$13,$14::jsonb)`,
          [
            id,
            documentNumber,
            sequenceNum,
            input.documentType,
            input.company,
            input.division,
            monthRoman,
            monthNumeric,
            year,
            input.documentTitle,
            input.documentDescription || null,
            userId,
            now,
            changeHistory,
          ]
        );
      } finally {
        client.release();
      }

      return {
        id,
        documentNumber,
        sequenceCounter: sequenceNum,
        documentType: input.documentType,
        company: input.company,
        division: input.division,
        monthRoman,
        monthNumeric,
        year,
        documentTitle: input.documentTitle,
        status: "draft",
        createdAt: now,
      };
    }),

  // List all document sequences with filters
  listDocumentSequences: protectedProcedure
    .input(
      z.object({
        company: z.enum(COMPANIES).optional(),
        division: z.enum(DIVISIONS).optional(),
        documentType: z.enum(DOCUMENT_TYPES).optional(),
        status: z
          .enum([
            "draft",
            "review",
            "approved",
            "effective",
            "superseded",
            "obsolete",
          ])
          .optional(),
        year: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (input.company) {
        conditions.push(`company = $${paramIdx++}`);
        params.push(input.company);
      }
      if (input.division) {
        conditions.push(`division = $${paramIdx++}`);
        params.push(input.division);
      }
      if (input.documentType) {
        conditions.push(`document_type = $${paramIdx++}`);
        params.push(input.documentType);
      }
      if (input.status) {
        conditions.push(`status = $${paramIdx++}`);
        params.push(input.status);
      }
      if (input.year) {
        conditions.push(`year = $${paramIdx++}`);
        params.push(input.year);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const client = await pgPool.connect();
      try {
        const countResult = await client.query(
          `SELECT COUNT(*) as total FROM document_sequences ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].total, 10);

        const dataParams = [...params, input.limit, input.offset];
        const results = await client.query(
          `SELECT * FROM document_sequences ${whereClause}
           ORDER BY created_at DESC
           LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          dataParams
        );

        return {
          data: results.rows,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } finally {
        client.release();
      }
    }),

  // Search document sequences
  searchDocumentSequences: protectedProcedure
    .input(
      z.object({ query: z.string().min(1), limit: z.number().default(20) })
    )
    .query(async ({ input }) => {
      const client = await pgPool.connect();
      try {
        const results = await client.query(
          `SELECT * FROM document_sequences
           WHERE document_number ILIKE $1 OR document_title ILIKE $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [`%${input.query}%`, input.limit]
        );
        return results.rows;
      } finally {
        client.release();
      }
    }),

  // Get document sequence by ID
  getDocumentSequence: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          "SELECT * FROM document_sequences WHERE id = $1",
          [input.id]
        );
        if (result.rows.length === 0)
          throw new Error("Document sequence not found");
        return result.rows[0];
      } finally {
        client.release();
      }
    }),

  // Update document sequence status
  updateDocumentStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "draft",
          "review",
          "approved",
          "effective",
          "superseded",
          "obsolete",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const now = new Date();
      const userId = ctx.user.id.toString();
      const client = await pgPool.connect();
      try {
        const existing = await client.query(
          "SELECT * FROM document_sequences WHERE id = $1",
          [input.id]
        );
        if (existing.rows.length === 0)
          throw new Error("Document sequence not found");

        const oldHistory = existing.rows[0].change_history || [];
        const newHistory = JSON.stringify([
          ...oldHistory,
          {
            action: "status_updated",
            timestamp: now.toISOString(),
            userId,
            oldStatus: existing.rows[0].status,
            newStatus: input.status,
            notes: input.notes,
          },
        ]);

        await client.query(
          `UPDATE document_sequences
           SET status = $1, updated_by = $2, updated_at = $3, change_history = $4::jsonb
           WHERE id = $5`,
          [input.status, userId, now, newHistory, input.id]
        );
        return { success: true };
      } finally {
        client.release();
      }
    }),

  // Get sequence counter statistics
  getCounterStats: protectedProcedure
    .input(
      z.object({
        company: z.enum(COMPANIES).optional(),
        division: z.enum(DIVISIONS).optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          "SELECT * FROM sequence_counters ORDER BY created_at DESC"
        );
        const filtered = result.rows.filter(counter => {
          if (input.company && !counter.prefix?.includes(input.company))
            return false;
          if (input.division && !counter.prefix?.includes(input.division))
            return false;
          return true;
        });
        return filtered.map(c => ({
          id: c.id,
          prefix: c.prefix,
          documentType: c.document_type,
          currentValue: c.current_value,
          lastReset: c.last_reset_at,
        }));
      } finally {
        client.release();
      }
    }),

  // Get constants for UI
  getConstants: protectedProcedure.query(() => ({
    documentTypes: DOCUMENT_TYPES,
    companies: COMPANIES,
    divisions: DIVISIONS,
    documentStatuses: [
      "draft",
      "review",
      "approved",
      "effective",
      "superseded",
      "obsolete",
    ],
    monthsRoman: MONTHS_ROMAN,
  })),
});
