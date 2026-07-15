/**
 * Document Sequence Generator Router
 *
 * Document sequences share the application's Azure Database for MySQL. Keeping
 * this feature on the primary database avoids a second, hidden PostgreSQL
 * dependency and gives sequence increments transactional locking.
 */

import { and, desc, eq, like, or, sql } from "drizzle-orm";
import type { RowDataPacket } from "mysql2";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  documentSequenceCounters,
  documentSequences,
} from "../../drizzle/schema";
import { db, mysqlPool } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

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
const DOCUMENT_STATUSES = [
  "draft",
  "review",
  "approved",
  "effective",
  "superseded",
  "obsolete",
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

export function getMonthRoman(monthNum: number): string {
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
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT current_value FROM document_sequence_counters WHERE id = ? FOR UPDATE",
      [counterId]
    );

    let nextValue: number;
    if (rows.length > 0) {
      nextValue = Number(rows[0].current_value) + 1;
      await connection.execute(
        "UPDATE document_sequence_counters SET current_value = ?, updated_at = NOW() WHERE id = ?",
        [nextValue, counterId]
      );
    } else {
      nextValue = 1;
      await connection.execute(
        `INSERT INTO document_sequence_counters
          (id, prefix, department, document_type, current_value, format_pattern,
           reset_period, last_reset_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, 'monthly', NOW(), NOW(), NOW())`,
        [
          counterId,
          `${company}-${division}`,
          division,
          documentType,
          `XXXX.${documentType}/${company}/${division}/MM/YYYY`,
        ]
      );
    }

    await connection.commit();
    return nextValue;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function formatDocumentNumber(
  sequenceNum: number,
  documentType: string,
  company: string,
  division: string,
  monthRoman: string,
  year: number
): string {
  return `${String(sequenceNum).padStart(4, "0")}.${documentType}/${company}/${division}/${monthRoman}/${year}`;
}

export const documentSequenceRouter = router({
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
      const sequenceCounter = await getNextSequenceNumber(
        input.documentType,
        input.company,
        input.division,
        year,
        monthNumeric
      );
      const documentNumber = formatDocumentNumber(
        sequenceCounter,
        input.documentType,
        input.company,
        input.division,
        monthRoman,
        year
      );
      const id = uuidv4();
      const userId = ctx.user.id.toString();

      await db.insert(documentSequences).values({
        id,
        documentNumber,
        sequenceCounter,
        documentType: input.documentType,
        company: input.company,
        division: input.division,
        monthRoman,
        monthNumeric,
        year,
        revisionNumber: 0,
        documentTitle: input.documentTitle,
        documentDescription: input.documentDescription || null,
        status: "draft",
        createdBy: userId,
        changeHistory: [
          {
            action: "created",
            timestamp: now.toISOString(),
            userId,
            changes: "Document sequence generated",
          },
        ],
      });

      return {
        id,
        documentNumber,
        sequenceCounter,
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

  listDocumentSequences: protectedProcedure
    .input(
      z.object({
        company: z.enum(COMPANIES).optional(),
        division: z.enum(DIVISIONS).optional(),
        documentType: z.enum(DOCUMENT_TYPES).optional(),
        status: z.enum(DOCUMENT_STATUSES).optional(),
        year: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = [
        input.company
          ? eq(documentSequences.company, input.company)
          : undefined,
        input.division
          ? eq(documentSequences.division, input.division)
          : undefined,
        input.documentType
          ? eq(documentSequences.documentType, input.documentType)
          : undefined,
        input.status ? eq(documentSequences.status, input.status) : undefined,
        input.year ? eq(documentSequences.year, input.year) : undefined,
      ].filter((condition): condition is NonNullable<typeof condition> =>
        Boolean(condition)
      );
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [countRows, data] = await Promise.all([
        db
          .select({ total: sql<number>`count(*)` })
          .from(documentSequences)
          .where(where),
        db
          .select()
          .from(documentSequences)
          .where(where)
          .orderBy(desc(documentSequences.createdAt))
          .limit(input.limit)
          .offset(input.offset),
      ]);

      return {
        data,
        total: Number(countRows[0]?.total ?? 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  searchDocumentSequences: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const pattern = `%${input.query}%`;
      return db
        .select()
        .from(documentSequences)
        .where(
          or(
            like(documentSequences.documentNumber, pattern),
            like(documentSequences.documentTitle, pattern)
          )
        )
        .orderBy(desc(documentSequences.createdAt))
        .limit(input.limit);
    }),

  getDocumentSequence: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [document] = await db
        .select()
        .from(documentSequences)
        .where(eq(documentSequences.id, input.id))
        .limit(1);
      if (!document) throw new Error("Document sequence not found");
      return document;
    }),

  updateDocumentStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(DOCUMENT_STATUSES),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [existing] = await db
        .select()
        .from(documentSequences)
        .where(eq(documentSequences.id, input.id))
        .limit(1);
      if (!existing) throw new Error("Document sequence not found");

      const now = new Date();
      const userId = ctx.user.id.toString();
      await db
        .update(documentSequences)
        .set({
          status: input.status,
          updatedBy: userId,
          changeHistory: [
            ...(existing.changeHistory ?? []),
            {
              action: "status_updated",
              timestamp: now.toISOString(),
              userId,
              oldStatus: existing.status,
              newStatus: input.status,
              notes: input.notes,
            },
          ],
        })
        .where(eq(documentSequences.id, input.id));
      return { success: true };
    }),

  getCounterStats: protectedProcedure
    .input(
      z.object({
        company: z.enum(COMPANIES).optional(),
        division: z.enum(DIVISIONS).optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const counters = await db
        .select()
        .from(documentSequenceCounters)
        .orderBy(desc(documentSequenceCounters.createdAt));
      return counters
        .filter(counter => {
          if (input.company && !counter.prefix.includes(input.company))
            return false;
          if (input.division && !counter.prefix.includes(input.division))
            return false;
          if (input.year && !counter.id.includes(`-${input.year}-`))
            return false;
          return true;
        })
        .map(counter => ({
          id: counter.id,
          prefix: counter.prefix,
          documentType: counter.documentType,
          currentValue: counter.currentValue,
          lastReset: counter.lastResetAt,
        }));
    }),

  getConstants: protectedProcedure.query(() => ({
    documentTypes: DOCUMENT_TYPES,
    companies: COMPANIES,
    divisions: DIVISIONS,
    documentStatuses: DOCUMENT_STATUSES,
    monthsRoman: MONTHS_ROMAN,
  })),
});
