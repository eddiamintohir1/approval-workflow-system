import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const DATABASE_URL = process.env.DATABASE_URL || process.env.CUSTOM_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('🌱 Seeding production workflow templates...\n');

// Get admin user ID (eddie.amintohir@compawnion.co)
const [adminUsers] = await connection.execute(
  'SELECT id FROM users WHERE email = ? LIMIT 1',
  ['eddie.amintohir@compawnion.co']
);

if (adminUsers.length === 0) {
  console.error('❌ Admin user not found. Please ensure eddie.amintohir@compawnion.co exists.');
  process.exit(1);
}

const adminId = adminUsers[0].id;

// Template 1: MAF (Material Authorization Form)
const mafTemplateId = uuidv4();
console.log('📝 Creating MAF template...');
await connection.execute(
  `INSERT INTO workflow_templates (id, name, description, workflow_type, is_active, is_default, created_by, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
  [
    mafTemplateId,
    'Material Authorization Form (MAF)',
    'Standard MAF workflow for material procurement requests requiring PPIC, GA, Finance, and CFO approval',
    'MAF',
    true,
    true,
    adminId
  ]
);

// MAF Stages
const mafStages = [
  { name: 'PPIC Review', role: 'PPIC', order: 1, description: 'PPIC department reviews material requirements' },
  { name: 'GA Approval', role: 'GA', order: 2, description: 'General Affairs approves procurement request' },
  { name: 'Finance Review', role: 'Finance', order: 3, description: 'Finance department reviews budget allocation' },
  { name: 'CFO Approval', role: 'CFO', order: 4, description: 'CFO final approval for material procurement' }
];

for (const stage of mafStages) {
  await connection.execute(
    `INSERT INTO template_stages (id, template_id, stage_name, stage_order, required_role, file_upload_required, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [uuidv4(), mafTemplateId, stage.name, stage.order, stage.role, true]
  );
}
console.log('✅ MAF template created with 4 stages\n');

// Template 2: PR (Purchase Request)
const prTemplateId = uuidv4();
console.log('📝 Creating PR template...');
await connection.execute(
  `INSERT INTO workflow_templates (id, name, description, workflow_type, is_active, is_default, created_by, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
  [
    prTemplateId,
    'Purchase Request (PR)',
    'Standard PR workflow for purchase requests requiring Department Head, Purchasing, Finance, and CFO approval',
    'PR',
    true,
    true,
    adminId
  ]
);

// PR Stages
const prStages = [
  { name: 'Department Head Review', role: 'admin', order: 1, description: 'Department head reviews purchase necessity' },
  { name: 'Purchasing Review', role: 'Purchasing', order: 2, description: 'Purchasing department reviews vendor and pricing' },
  { name: 'Finance Review', role: 'Finance', order: 3, description: 'Finance department reviews budget and payment terms' },
  { name: 'CFO Approval', role: 'CFO', order: 4, description: 'CFO final approval for purchase request' }
];

for (const stage of prStages) {
  await connection.execute(
    `INSERT INTO template_stages (id, template_id, stage_name, stage_order, required_role, file_upload_required, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [uuidv4(), prTemplateId, stage.name, stage.order, stage.role, true]
  );
}
console.log('✅ PR template created with 4 stages\n');

// Template 3: Reimbursement
const reimbTemplateId = uuidv4();
console.log('📝 Creating Reimbursement template...');
await connection.execute(
  `INSERT INTO workflow_templates (id, name, description, workflow_type, is_active, is_default, created_by, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
  [
    reimbTemplateId,
    'Expense Reimbursement',
    'Standard reimbursement workflow for employee expense claims requiring Department Head, Finance, and CFO approval',
    'Reimbursement',
    true,
    true,
    adminId
  ]
);

// Reimbursement Stages
const reimbStages = [
  { name: 'Department Head Review', role: 'admin', order: 1, description: 'Department head verifies expense legitimacy' },
  { name: 'Finance Review', role: 'Finance', order: 2, description: 'Finance department verifies receipts and calculates reimbursement' },
  { name: 'CFO Approval', role: 'CFO', order: 3, description: 'CFO final approval for reimbursement payment' }
];

for (const stage of reimbStages) {
  await connection.execute(
    `INSERT INTO template_stages (id, template_id, stage_name, stage_order, required_role, file_upload_required, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [uuidv4(), reimbTemplateId, stage.name, stage.order, stage.role, true]
  );
}
console.log('✅ Reimbursement template created with 3 stages\n');

await connection.end();

console.log('🎉 Production templates seeded successfully!');
console.log('\nTemplates created:');
console.log('  1. Material Authorization Form (MAF) - 4 stages');
console.log('  2. Purchase Request (PR) - 4 stages');
console.log('  3. Expense Reimbursement - 3 stages');
