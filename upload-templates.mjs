import { readFileSync } from "fs";
import { storagePut } from "./server/storage.ts";

const templates = [
  { file: "PR02.2026.xlsx", type: "PR", name: "Purchase Request Form" },
  { file: "CattoPAF02.2026.xlsx", type: "PAF", name: "Product Approval Form" },
  { file: "MAF02.2026.xlsx", type: "MAF", name: "Marketing Approval Form" },
];

async function uploadTemplates() {
  console.log("Uploading form templates to Azure Blob Storage...\n");

  for (const template of templates) {
    try {
      const filePath = `./form_templates/${template.file}`;
      const fileBuffer = readFileSync(filePath);

      const storageKey = `templates/${template.type}/${template.file}`;
      const result = await storagePut(
        storageKey,
        fileBuffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      console.log(`✓ Uploaded ${template.name}`);
      console.log(`  File: ${template.file}`);
      console.log(`  Blob key: ${result.key}`);
      console.log(`  URL: ${result.url.substring(0, 80)}...\n`);
    } catch (error) {
      console.error(`✗ Failed to upload ${template.name}:`, error.message);
    }
  }

  console.log("Template upload complete!");
}

uploadTemplates().catch(console.error);
