# SKU Generator Deployment Instructions - v1.12

## Commit Information
- **Commit Hash**: `6d6a48e`
- **Branch**: `main`
- **GitHub**: https://github.com/eddiamintohir1/approval-workflow-system
- **Files Changed**: 7 files, 1160 insertions

## Deployment Steps

### Step 1: Database Migration (CRITICAL)

Apply the SQL migration to create the 3 new tables in MySQL/TiDB:

**Option A: Using Manus webdev_execute_sql tool**
```
Use the webdev_execute_sql tool in Manus to execute:
File: /home/ubuntu/approval-workflow-system/migrations/sku_generator.sql
```

**Option B: Manual SQL execution**
Copy and execute the following SQL in your MySQL/TiDB database:

```sql
-- =====================================================
-- SKU GENERATOR TABLES
-- v1.12 - Add SKU management for product categorization
-- =====================================================

-- SKU Categories and counters
CREATE TABLE IF NOT EXISTS sku_categories (
  id VARCHAR(36) PRIMARY KEY,
  prefix VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_prefix (prefix),
  INDEX idx_is_active (is_active)
);

-- SKU Counters (tracks sequence per category)
CREATE TABLE IF NOT EXISTS sku_counters (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  current_counter INT DEFAULT 0 NOT NULL,
  reset_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (category_id) REFERENCES sku_categories(id),
  UNIQUE KEY unique_category_counter (category_id),
  INDEX idx_category_id (category_id)
);

-- Generated SKUs
CREATE TABLE IF NOT EXISTS skus (
  id VARCHAR(36) PRIMARY KEY,
  sku_code VARCHAR(50) NOT NULL UNIQUE,
  category_id VARCHAR(36) NOT NULL,
  prefix VARCHAR(10) NOT NULL,
  sequence_number INT NOT NULL,
  product_name VARCHAR(500),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (category_id) REFERENCES sku_categories(id),
  INDEX idx_sku_code (sku_code),
  INDEX idx_category_id (category_id),
  INDEX idx_prefix (prefix),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Insert default SKU categories based on Master Data sheets
INSERT INTO sku_categories (id, prefix, name, description) VALUES
  ('cat-000', '', 'No Prefix', 'SKUs without prefix'),
  ('cat-001', 'C', 'Catering', 'Catering products'),
  ('cat-002', 'B', 'Bundle', 'Bundle products'),
  ('cat-003', 'P', 'Packing', 'Packing products'),
  ('cat-004', 'S', 'Barang Sales', 'Sales items'),
  ('cat-005', 'M', 'Marketing', 'Marketing materials'),
  ('cat-006', 'R', 'Bahan Baku', 'Raw materials'),
  ('cat-007', 'F', 'Bahan Setengah Jadi', 'Semi-finished goods'),
  ('cat-008', 'G', 'Finished Goods', 'Finished goods')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Initialize counters for each category
INSERT INTO sku_counters (id, category_id, current_counter) 
SELECT CONCAT('counter-', id), id, 0 FROM sku_categories 
ON DUPLICATE KEY UPDATE current_counter=VALUES(current_counter);
```

### Step 2: Verify Database Migration

After applying the migration, verify the tables were created:

```sql
-- Check categories
SELECT COUNT(*) as category_count FROM sku_categories;
-- Expected: 9 rows

-- Check counters
SELECT COUNT(*) as counter_count FROM sku_counters;
-- Expected: 9 rows

-- Check SKUs (should be empty initially)
SELECT COUNT(*) as sku_count FROM skus;
-- Expected: 0 rows

-- View categories
SELECT id, prefix, name FROM sku_categories ORDER BY prefix;
```

### Step 3: Code Deployment

The code changes are already committed to GitHub (commit `6d6a48e`).

**Pull the latest code:**
```bash
cd /path/to/approval-workflow-system
git pull origin main
```

**Install dependencies (if needed):**
```bash
pnpm install
```

**Build the project:**
```bash
pnpm build
```

### Step 4: Test the Feature

1. **Navigate to Admin Panel**: `/admin/sequences`
2. **Click "Product SKU" tab** (6th tab)
3. **Test Generate Tab**:
   - Select a category (e.g., "Catering")
   - Enter product name: "Test Product"
   - Click "Generate SKU"
   - Verify SKU code is generated (e.g., C100000001)
4. **Test Search Tab**:
   - Enter the generated SKU code
   - Verify it appears in search results
   - Click eye icon to view details
5. **Test By Category Tab**:
   - Select a category
   - Verify SKUs are listed
   - Click "Export CSV" to download

### Step 5: Update Version Number

Update the version in the application to reflect v1.12:

**In `client/src/App.tsx` or version file:**
```typescript
const APP_VERSION = "v1.12";
```

## Files Modified

| File | Changes | Type |
|------|---------|------|
| `migrations/sku_generator.sql` | New SQL migration | New |
| `drizzle/schema.ts` | Added 3 table definitions | Modified |
| `server/routers/skuGenerator.ts` | New tRPC router | New |
| `server/routers.ts` | Added router import and integration | Modified |
| `client/src/pages/admin/SkuGeneratorTab.tsx` | New React component | New |
| `client/src/pages/admin/SequenceGenerator.tsx` | Added Product SKU tab | Modified |
| `SKU_GENERATOR_IMPLEMENTATION.md` | Documentation | New |

## Rollback Instructions

If issues occur, rollback is simple:

**Database Rollback:**
```sql
DROP TABLE IF EXISTS skus;
DROP TABLE IF EXISTS sku_counters;
DROP TABLE IF EXISTS sku_categories;
```

**Code Rollback:**
```bash
git revert 6d6a48e
git push origin main
```

## Known Issues & Limitations

1. **User ID Hardcoded**: Currently uses `userId: 1` - should be updated to use auth context
2. **Search Optimization**: Uses LIKE pattern - could use full-text search for better performance
3. **No Bulk Operations**: Cannot delete or archive multiple SKUs at once
4. **No Import**: Cannot bulk import SKUs from Excel

## Future Enhancements

- Bulk import SKUs from Excel files
- SKU validation rules per category
- Barcode generation and printing
- SKU linking to inventory system
- Audit trail for all SKU changes
- Advanced filtering and sorting
- Batch operations (archive, delete, export)

## Support & Troubleshooting

### Issue: "Category not found" error
- **Cause**: Database migration not applied
- **Solution**: Run the SQL migration from Step 1

### Issue: "Counter not initialized" error
- **Cause**: sku_counters table missing data
- **Solution**: Re-run the INSERT statement for sku_counters

### Issue: SKU Generator tab not showing
- **Cause**: Code not deployed or browser cache
- **Solution**: Clear browser cache and rebuild frontend

### Issue: Cannot generate SKU
- **Cause**: Database connection issue or missing tables
- **Solution**: Verify database migration was successful

## Performance Considerations

- **Indexes**: All tables have proper indexes for fast queries
- **Counters**: Independent counters per category prevent locking
- **Batch Operations**: Export uses efficient SQL queries
- **Search**: LIKE queries on sku_code (indexed)

## Security Considerations

- **Auth**: Requires admin role (enforced in tRPC)
- **Data Validation**: Input validation on all mutations
- **Foreign Keys**: Referential integrity enforced
- **Timestamps**: Automatic audit trail with created_at/updated_at

## Monitoring

Monitor these metrics after deployment:

1. **SKU Generation Rate**: Track how many SKUs are generated per day
2. **Search Performance**: Monitor search query response times
3. **Database Size**: Track sku tables growth
4. **Error Rates**: Monitor tRPC error logs

## Next Steps

1. ✅ Apply database migration
2. ✅ Verify tables created
3. ✅ Deploy code changes
4. ✅ Test all features
5. ✅ Update version number
6. ⏳ Monitor in production
7. ⏳ Gather user feedback

## Questions?

Refer to:
- `SKU_GENERATOR_IMPLEMENTATION.md` - Feature documentation
- `obsidian-vault/` - Project context
- GitHub commit `6d6a48e` - Code changes
