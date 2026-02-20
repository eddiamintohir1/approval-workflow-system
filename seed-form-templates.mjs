import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

const templates = [
  {
    templateName: 'Material Approval Form (MAF)',
    templateCode: 'MAF',
    description: 'Form for requesting approval for material purchases and procurement',
    version: 1,
    isActive: true,
    fields: [
      {
        id: 'requester_name',
        type: 'text',
        label: 'Requester Name',
        placeholder: 'Enter your full name',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'requester_department',
        type: 'dropdown',
        label: 'Department',
        placeholder: 'Select department',
        required: true,
        options: ['GA', 'PPIC', 'Production', 'Purchasing', 'Finance', 'HR', 'IT'],
        validation: {}
      },
      {
        id: 'request_date',
        type: 'date',
        label: 'Request Date',
        placeholder: '',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'material_description',
        type: 'textarea',
        label: 'Material Description',
        placeholder: 'Describe the materials needed in detail',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'quantity',
        type: 'number',
        label: 'Quantity',
        placeholder: 'Enter quantity',
        required: true,
        options: [],
        validation: { min: 1 }
      },
      {
        id: 'unit_of_measure',
        type: 'text',
        label: 'Unit of Measure',
        placeholder: 'e.g., pcs, kg, liters',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'estimated_cost',
        type: 'number',
        label: 'Estimated Cost (IDR)',
        placeholder: 'Enter estimated cost',
        required: true,
        options: [],
        validation: { min: 0 }
      },
      {
        id: 'justification',
        type: 'textarea',
        label: 'Justification',
        placeholder: 'Explain why this material is needed',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'preferred_vendor',
        type: 'text',
        label: 'Preferred Vendor (Optional)',
        placeholder: 'Enter vendor name if any',
        required: false,
        options: [],
        validation: {}
      },
      {
        id: 'required_delivery_date',
        type: 'date',
        label: 'Required Delivery Date',
        placeholder: '',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'attachment',
        type: 'file',
        label: 'Supporting Documents',
        placeholder: '',
        required: false,
        options: [],
        validation: {}
      }
    ]
  },
  {
    templateName: 'Purchase Request (PR)',
    templateCode: 'PR',
    description: 'Form for requesting purchase of goods or services',
    version: 1,
    isActive: true,
    fields: [
      {
        id: 'requester_name',
        type: 'text',
        label: 'Requester Name',
        placeholder: 'Enter your full name',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'requester_department',
        type: 'dropdown',
        label: 'Department',
        placeholder: 'Select department',
        required: true,
        options: ['GA', 'PPIC', 'Production', 'Purchasing', 'Finance', 'HR', 'IT'],
        validation: {}
      },
      {
        id: 'pr_date',
        type: 'date',
        label: 'PR Date',
        placeholder: '',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'vendor_name',
        type: 'text',
        label: 'Vendor Name',
        placeholder: 'Enter vendor/supplier name',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'vendor_contact',
        type: 'text',
        label: 'Vendor Contact',
        placeholder: 'Phone or email',
        required: false,
        options: [],
        validation: {}
      },
      {
        id: 'item_description',
        type: 'textarea',
        label: 'Item Description',
        placeholder: 'Describe items to be purchased',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'quantity',
        type: 'number',
        label: 'Quantity',
        placeholder: 'Enter quantity',
        required: true,
        options: [],
        validation: { min: 1 }
      },
      {
        id: 'unit_price',
        type: 'number',
        label: 'Unit Price (IDR)',
        placeholder: 'Enter unit price',
        required: true,
        options: [],
        validation: { min: 0 }
      },
      {
        id: 'total_amount',
        type: 'number',
        label: 'Total Amount (IDR)',
        placeholder: 'Total cost',
        required: true,
        options: [],
        validation: { min: 0 }
      },
      {
        id: 'delivery_location',
        type: 'text',
        label: 'Delivery Location',
        placeholder: 'Where should items be delivered',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'required_delivery_date',
        type: 'date',
        label: 'Required Delivery Date',
        placeholder: '',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'payment_terms',
        type: 'dropdown',
        label: 'Payment Terms',
        placeholder: 'Select payment terms',
        required: true,
        options: ['Cash on Delivery', 'Net 30', 'Net 60', 'Advance Payment', 'Other'],
        validation: {}
      },
      {
        id: 'purpose',
        type: 'textarea',
        label: 'Purpose/Justification',
        placeholder: 'Explain the purpose of this purchase',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'quotation_attachment',
        type: 'file',
        label: 'Quotation/Invoice',
        placeholder: '',
        required: false,
        options: [],
        validation: {}
      }
    ]
  },
  {
    templateName: 'Capital Approval (CATTO)',
    templateCode: 'CATTO',
    description: 'Form for requesting approval for capital expenditure projects',
    version: 1,
    isActive: true,
    fields: [
      {
        id: 'project_name',
        type: 'text',
        label: 'Project Name',
        placeholder: 'Enter project name',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'requester_name',
        type: 'text',
        label: 'Requester Name',
        placeholder: 'Enter your full name',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'requester_department',
        type: 'dropdown',
        label: 'Department',
        placeholder: 'Select department',
        required: true,
        options: ['GA', 'PPIC', 'Production', 'Purchasing', 'Finance', 'HR', 'IT'],
        validation: {}
      },
      {
        id: 'project_type',
        type: 'dropdown',
        label: 'Project Type',
        placeholder: 'Select project type',
        required: true,
        options: ['Equipment Purchase', 'Facility Upgrade', 'IT Infrastructure', 'Expansion', 'Other'],
        validation: {}
      },
      {
        id: 'project_description',
        type: 'textarea',
        label: 'Project Description',
        placeholder: 'Provide detailed description of the capital project',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'business_justification',
        type: 'textarea',
        label: 'Business Justification',
        placeholder: 'Explain the business case and expected benefits',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'total_capex_amount',
        type: 'number',
        label: 'Total CAPEX Amount (IDR)',
        placeholder: 'Enter total capital expenditure',
        required: true,
        options: [],
        validation: { min: 0 }
      },
      {
        id: 'budget_year',
        type: 'number',
        label: 'Budget Year',
        placeholder: 'e.g., 2026',
        required: true,
        options: [],
        validation: { min: 2020, max: 2050 }
      },
      {
        id: 'expected_roi',
        type: 'text',
        label: 'Expected ROI',
        placeholder: 'e.g., 15% in 3 years',
        required: false,
        options: [],
        validation: {}
      },
      {
        id: 'project_start_date',
        type: 'date',
        label: 'Planned Start Date',
        placeholder: '',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'project_end_date',
        type: 'date',
        label: 'Planned End Date',
        placeholder: '',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'resources_required',
        type: 'textarea',
        label: 'Resources Required',
        placeholder: 'List personnel, equipment, and other resources needed',
        required: true,
        options: [],
        validation: {}
      },
      {
        id: 'risk_assessment',
        type: 'textarea',
        label: 'Risk Assessment',
        placeholder: 'Identify potential risks and mitigation strategies',
        required: false,
        options: [],
        validation: {}
      },
      {
        id: 'supporting_documents',
        type: 'file',
        label: 'Supporting Documents',
        placeholder: '',
        required: false,
        options: [],
        validation: {}
      }
    ]
  }
];

async function seedFormTemplates() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('🌱 Starting form template seeding...\n');
    
    for (const template of templates) {
      console.log(`📝 Creating template: ${template.templateName} (${template.templateCode})`);
      
      // Check if template already exists
      const [existing] = await connection.execute(
        'SELECT id FROM form_templates WHERE template_code = ?',
        [template.templateCode]
      );
      
      if (existing.length > 0) {
        console.log(`   ⚠️  Template ${template.templateCode} already exists, skipping...`);
        continue;
      }
      
      // Insert template (created_by = 1 for system/admin)
      const [result] = await connection.execute(
        `INSERT INTO form_templates 
         (template_name, template_code, description, version, is_active, fields, created_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          template.templateName,
          template.templateCode,
          template.description,
          template.version,
          template.isActive,
          JSON.stringify(template.fields)
        ]
      );
      
      console.log(`   ✅ Created template with ${template.fields.length} fields (ID: ${result.insertId})`);
    }
    
    console.log('\n✨ Form template seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding form templates:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

seedFormTemplates();
