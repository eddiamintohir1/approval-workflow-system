import { describe, it, expect } from "vitest";
import { Pool } from "pg";

describe("AWS RDS PostgreSQL Connection", () => {
  it("should connect to AWS RDS database successfully", async () => {
    const connectionString = process.env.CUSTOM_DATABASE_URL;
    
    expect(connectionString).toBeDefined();
    expect(connectionString).toContain("postgresql://");
    
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    try {
      const result = await pool.query("SELECT NOW()");
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeDefined();
      console.log("✅ AWS RDS connection successful at:", result.rows[0].now);
    } finally {
      await pool.end();
    }
  }, 10000);

  it("should verify workflow_system schema exists", async () => {
    const pool = new Pool({
      connectionString: process.env.CUSTOM_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    try {
      const result = await pool.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = 'workflow_system'
      `);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].schema_name).toBe("workflow_system");
      console.log("✅ workflow_system schema exists");
    } finally {
      await pool.end();
    }
  }, 10000);
});
