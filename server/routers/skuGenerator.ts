import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { skuCategories, skuCounters, skus } from "../../drizzle/schema";
import { eq, and, like, desc } from "drizzle-orm";

/**
 * SKU Generator Router
 * Handles generation, search, and management of SKU codes
 */
export const skuGeneratorRouter = router({
  /**
   * Get all SKU categories
   */
  getCategories: publicProcedure.query(async () => {
    try {
      const categories = await db
        .select()
        .from(skuCategories)
        .where(eq(skuCategories.isActive, true))
        .orderBy(skuCategories.prefix);
      return categories;
    } catch (error) {
      console.error("Error fetching SKU categories:", error);
      throw new Error("Failed to fetch SKU categories");
    }
  }),

  /**
   * Generate a new SKU for a given category
   */
  generateSku: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        productName: z.string().optional(),
        description: z.string().optional(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get category details
        const category = await db
          .select()
          .from(skuCategories)
          .where(eq(skuCategories.id, input.categoryId))
          .limit(1);

        if (!category || category.length === 0) {
          throw new Error("Category not found");
        }

        const categoryData = category[0];

        // Get current counter for this category
        const counterResult = await db
          .select()
          .from(skuCounters)
          .where(eq(skuCounters.categoryId, input.categoryId))
          .limit(1);

        if (!counterResult || counterResult.length === 0) {
          throw new Error("Counter not initialized for this category");
        }

        const counter = counterResult[0];
        const nextSequence = counter.currentCounter + 1;

        // Format SKU code: Prefix + 9-digit padded sequence
        // Example: C100010500 (C + 100010500)
        const sequenceStr = String(nextSequence).padStart(9, "0");
        const skuCode = `${categoryData.prefix}${sequenceStr}`;

        // Create new SKU record
        const skuId = uuidv4();
        const now = new Date();

        await db.insert(skus).values({
          id: skuId,
          skuCode,
          categoryId: input.categoryId,
          prefix: categoryData.prefix,
          sequenceNumber: nextSequence,
          productName: input.productName || null,
          description: input.description || null,
          status: "active",
          createdBy: input.userId,
          createdAt: now,
          updatedAt: now,
        });

        // Update counter
        await db
          .update(skuCounters)
          .set({
            currentCounter: nextSequence,
            updatedAt: now,
          })
          .where(eq(skuCounters.id, counter.id));

        return {
          success: true,
          skuId,
          skuCode,
          sequenceNumber: nextSequence,
          categoryName: categoryData.name,
          prefix: categoryData.prefix,
        };
      } catch (error) {
        console.error("Error generating SKU:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to generate SKU"
        );
      }
    }),

  /**
   * Search SKUs by code or product name
   */
  searchSkus: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        categoryId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        let query = db.select().from(skus);

        // Build WHERE conditions
        const conditions = [];

        if (input.query) {
          conditions.push(
            like(skus.skuCode, `%${input.query}%`)
          );
        }

        if (input.categoryId) {
          conditions.push(eq(skus.categoryId, input.categoryId));
        }

        if (input.status) {
          conditions.push(eq(skus.status, input.status));
        }

        // Apply conditions
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        // Get total count
        const countResult = await db
          .select({ count: skus.id })
          .from(skus)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const total = countResult.length > 0 ? 1 : 0; // Simplified count

        // Get paginated results
        const results = await query
          .orderBy(desc(skus.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          data: results,
          total: results.length,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("Error searching SKUs:", error);
        throw new Error("Failed to search SKUs");
      }
    }),

  /**
   * Get SKU details by ID
   */
  getSkuDetails: publicProcedure
    .input(z.object({ skuId: z.string() }))
    .query(async ({ input }) => {
      try {
        const sku = await db
          .select()
          .from(skus)
          .where(eq(skus.id, input.skuId))
          .limit(1);

        if (!sku || sku.length === 0) {
          throw new Error("SKU not found");
        }

        // Get category details
        const category = await db
          .select()
          .from(skuCategories)
          .where(eq(skuCategories.id, sku[0].categoryId))
          .limit(1);

        return {
          sku: sku[0],
          category: category?.[0] || null,
        };
      } catch (error) {
        console.error("Error fetching SKU details:", error);
        throw new Error("Failed to fetch SKU details");
      }
    }),

  /**
   * Get all SKUs for a category (for export/listing)
   */
  getSkusByCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = await db
          .select()
          .from(skus)
          .where(eq(skus.categoryId, input.categoryId))
          .orderBy(desc(skus.sequenceNumber))
          .limit(input.limit)
          .offset(input.offset);

        return {
          data: results,
          total: results.length,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("Error fetching SKUs by category:", error);
        throw new Error("Failed to fetch SKUs");
      }
    }),

  /**
   * Get counter information for a category
   */
  getCategoryCounter: publicProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ input }) => {
      try {
        const counter = await db
          .select()
          .from(skuCounters)
          .where(eq(skuCounters.categoryId, input.categoryId))
          .limit(1);

        if (!counter || counter.length === 0) {
          throw new Error("Counter not found");
        }

        return counter[0];
      } catch (error) {
        console.error("Error fetching counter:", error);
        throw new Error("Failed to fetch counter");
      }
    }),

  /**
   * Export SKUs as CSV data
   */
  exportSkus: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        let query = db.select().from(skus);

        const conditions = [];
        if (input.categoryId) {
          conditions.push(eq(skus.categoryId, input.categoryId));
        }
        if (input.status) {
          conditions.push(eq(skus.status, input.status));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        const results = await query.orderBy(desc(skus.createdAt));

        // Format for CSV
        const csvData = results.map((sku) => ({
          "SKU Code": sku.skuCode,
          "Product Name": sku.productName || "-",
          "Category": sku.categoryId,
          "Prefix": sku.prefix,
          "Sequence": sku.sequenceNumber,
          "Status": sku.status,
          "Created At": new Date(sku.createdAt).toISOString(),
        }));

        return csvData;
      } catch (error) {
        console.error("Error exporting SKUs:", error);
        throw new Error("Failed to export SKUs");
      }
    }),
});
