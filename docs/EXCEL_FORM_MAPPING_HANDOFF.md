# Excel Form-Template Mapping — Implementation Handoff

## Objective

Extend the existing generalized workflow system so an administrator can upload an `.xlsx` workbook, link it to a form template, map canonical form fields to workbook targets, and generate a completed workbook from a form submission.

This must reuse the existing form-template, submission, workflow, processing-inbox, Azure Blob, and Microsoft Entra functionality. Do not introduce AWS, Cognito, or a second workflow engine.

## Required user flow

1. An administrator uploads an `.xlsx` workbook in **Excel Templates**.
2. The system inspects its sheets, cells, named ranges, and Excel tables.
3. The administrator links the workbook to one form template.
4. The administrator maps fields such as `account_number` and `account_name` to:
   - a sheet and cell address;
   - a workbook named range; or
   - an Excel table column for repeating rows.
5. The mapping is validated and saved.
6. An authorized user selects a submitted form or workflow and generates the completed workbook.
7. The generated workbook preserves the uploaded workbook's styles, formulas, logos, and layout.
8. Processing Inbox can show incomplete, draft, submitted, completed, and processed items using the existing generalized workflow functions. Marking an item processed continues to notify the form submitter through the existing notification mechanism.

Batch workbook generation from the inbox can be a later increment. Do not block single-submission generation on it.

## Current implementation and gaps

- `drizzle/schema.ts` defines `excel_templates` with file metadata and Azure Blob location, but it has no form-template link or workbook mappings.
- `client/src/pages/ExcelTemplates.tsx` supports upload, metadata editing, download, and deletion. It currently accepts `.xlsx` and legacy `.xls`.
- The `excelTemplates` router in `server/routers.ts` uploads base64 content through `storagePut`, returns signed download URLs, and updates/deletes metadata. A stale comment may still say S3, but storage is Azure.
- `server/storage.ts` exposes `storagePut` and `storageGet`. Generation needs a server-side byte-download helper.
- `server/excelExport.ts` uses ExcelJS but relies on hardcoded local template paths and hardcoded cells. It is not connected to uploaded templates, form templates, or form submissions.
- Form-template fields in `drizzle/schema.ts` already support `mappingKey`, `showInTable`, `tableLabel`, and `tableOrder`.
- Submission `formData` is keyed by field ID. Generation therefore must resolve each form field's `mappingKey` to `submission.formData[field.id]`.
- `server/formProcessing.ts` already derives mapped values for the generalized processing inbox and should be reused where practical.

Restrict mapping-enabled uploads to `.xlsx`; ExcelJS does not reliably support legacy `.xls` workbooks.

## Proposed data model

Add a migration and corresponding schema fields to `excel_templates`:

```ts
formTemplateId: varchar("form_template_id", { length: 36 }),
workbookMappings: json("workbook_mappings")
  .$type<ExcelWorkbookMapping[]>()
  .default([]),
workbookMetadata: json("workbook_metadata").$type<WorkbookMetadata>(),
outputFileNamePattern: varchar("output_file_name_pattern", { length: 255 }),
```

Put reusable types and validation in a shared module such as `shared/excelMapping.ts`:

```ts
type ExcelWorkbookMapping =
  | {
      mappingKey: string;
      targetType: "cell";
      sheetName: string;
      cellAddress: string;
      valueType?: "auto" | "text" | "number" | "date";
    }
  | {
      mappingKey: string;
      targetType: "named_range";
      namedRange: string;
      valueType?: "auto" | "text" | "number" | "date";
    }
  | {
      mappingKey: string;
      targetType: "table_column";
      sheetName: string;
      tableName: string;
      columnName: string;
      sourcePath?: string;
      valueType?: "auto" | "text" | "number" | "date";
    };
```

Support explicit built-in keys in addition to form-field mapping keys, for example `workflow_number`, `workflow_title`, `department`, `submitter_name`, and `submitted_at`. Keep the supported built-in list centralized and validated.

## Workbook service

Create `server/excelWorkbook.ts` around the existing ExcelJS dependency.

### `inspectWorkbook(buffer)`

Return a bounded metadata payload containing:

- worksheet names and dimensions;
- a limited set of non-empty cells for a mapping preview;
- defined names and their ranges;
- Excel tables and column names.

Do not return every cell in a large workbook. Set explicit worksheet, row, column, cell, and response-size limits.

### `generateMappedWorkbook(input)`

Inputs should include the template bytes, saved mappings, form template, submission, workflow, and submitter context.

1. Load a fresh copy of the uploaded workbook.
2. Build canonical values by mapping every form-template field's `mappingKey` to `formData[field.id]`, then add supported built-in values.
3. Write scalar values to cells or named ranges.
4. Append repeating data through the ExcelJS Table API and commit table changes.
5. Set only mapped cell values so formatting and formulas remain intact.
6. Serialize with `workbook.xlsx.writeBuffer()`.

Validate that sheets, A1-style cell addresses, named ranges, tables, columns, and mapping keys exist. Reject duplicate or ambiguous mapping keys.

Identifiers such as account numbers must support `valueType: "text"` so leading zeroes are preserved. Strings beginning with `=`, `+`, `-`, or `@` must not become executable spreadsheet formulas; write them as text unless the mapping explicitly targets a trusted formula field, which is out of scope for the first version.

Add `storageDownload(key): Promise<Buffer>` to `server/storage.ts` using Azure Blob APIs. Never expose the storage connection string to the client.

## API design

Extend the existing `excelTemplates` router rather than creating a separate backend:

- `inspect({ id })`: administrator only; downloads the source workbook from Azure, inspects it, and optionally caches bounded metadata.
- `saveMapping({ id, formTemplateId, mappings, outputFileNamePattern })`: administrator only; validates every source and target and records an audit event.
- `generateForSubmission({ excelTemplateId, submissionId })`: protected; authorize the submitter, an administrator, or a user entitled to the related workflow.
- `generateForWorkflow({ excelTemplateId, workflowId })`: protected; resolves the applicable/latest submission and applies the same authorization.

Prefer uploading generated output to Azure Blob and returning a short-lived signed URL and filename. If returning base64 for an initial implementation, enforce a strict response-size limit.

Tighten upload, edit, inspect, mapping, and delete operations to administrator-only if they are currently merely authenticated. Validate extension, MIME type, workbook signature, and a conservative decoded file-size limit before parsing.

## UI design

- Add **Configure Mapping** to each Excel template in `client/src/pages/ExcelTemplates.tsx`.
- Add an administrator route such as `/admin/excel-templates/:id/mapping`.
- Build the mapping screen from small components, for example `ExcelMappingEditor.tsx`, with:
  - linked form-template selector;
  - source field label and canonical `mappingKey`;
  - target-type selector;
  - sheet/cell, named-range, or table/column controls populated from inspection metadata;
  - value-type selector;
  - inline validation and save action.
- Add **Generate Excel** to the appropriate submission/workflow detail surface when a linked workbook exists.
- Keep the existing Processing Inbox as the status table. A later batch-export action may select multiple eligible rows.

Use the project's existing shadcn/ui patterns and permission helpers. Do not build a second status or approval system.

## Audit, authorization, and safety

- Audit upload, mapping changes, generation, download, and deletion.
- Treat workbook contents and generated files as potentially sensitive financial data.
- Use Azure Blob private objects and short-lived signed URLs.
- Validate authorization on every server action; hiding a UI button is not sufficient.
- Do not allow arbitrary formulas or arbitrary Blob keys from the client.
- Sanitize output filenames and prevent path traversal.
- Rate-limit or otherwise bound workbook parsing and generation.
- Do not add AWS SDK, Cognito, S3, or non-Microsoft authentication.

## Tests

Create a generated `.xlsx` fixture with:

- a `Payment Request` worksheet;
- styled cells and named ranges for account number and account name;
- an `InvoiceItems` table;
- at least one formula and recognizable formatting.

Cover:

- inspection finds sheets, named ranges, tables, and columns;
- generation writes account number and name correctly;
- a leading-zero account number remains text;
- repeating rows are appended to the correct table columns;
- formulas and styles outside mapped values are preserved;
- invalid sheet, cell, named range, table, column, and mapping key fail safely;
- upload and mapping mutations enforce administrator permissions;
- generated-file access enforces workflow/submission permissions;
- upload, inspect, map, submit, generate, and download work end-to-end.

Run the repository build and focused TypeScript/tests before deployment.

## Deployment context

Current production endpoints:

- `https://wfmt.compawnion.id`
- `https://approval-workflow-system-nine.vercel.app`

Vercel identifiers:

- Team: `team_WNFWTd4uHVmmuJlkR2XCMOtO`
- Project: `prj_KFmE1xUUe43wlYuE9nCjsvL1VdZJ`

Azure context (identifiers only; do not commit secrets):

- Tenant: `5de33f3d-7a65-45f5-980d-5ccea9e9f19e`
- Subscription: `bd9c5989-d015-4e3f-9ea0-3062f569d897`
- Resource group: `cjb-approval-prod-rg`
- MySQL host: `cjb-approval-mysql-prod-20260715.mysql.database.azure.com`
- Database: `approval_workflow`
- Storage account: `cjbapprovalprod260715`
- Blob container: `finance-attachments`

Apply the migration to Azure MySQL through the existing `DATABASE_URL`. Authentication is Microsoft Entra only. The production callback is `https://wfmt.compawnion.id/auth/callback`.

Deploy to a Vercel preview first, run browser/API/data verification, and promote only after the full flow passes. Leave no test users, submissions, workflows, or generated files in production.

## Definition of done

- [ ] Only valid, size-limited `.xlsx` mapping templates are accepted.
- [ ] Uploaded workbooks are inspected from Azure Blob.
- [ ] An Excel template can be linked to a generalized form template.
- [ ] Cell, named-range, and table-column mappings validate and persist.
- [ ] Generated workbooks contain mapped submission values.
- [ ] Text identifiers preserve leading zeroes.
- [ ] Existing formulas, formatting, images, and layout remain intact.
- [ ] Only authorized users can configure mappings or generate/download files.
- [ ] Audit events cover template and generation actions.
- [ ] Unit, authorization, build, and end-to-end checks pass.
- [ ] Vercel preview and production are verified through browser, API, and database/storage behavior.
- [ ] Microsoft Entra sign-in and existing generalized workflow behavior remain functional.
