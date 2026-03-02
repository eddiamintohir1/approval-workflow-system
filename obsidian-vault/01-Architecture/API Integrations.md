---
title: API Integrations
tags: [architecture, api, integrations]
---

# API Integrations

## Dropbox Sign (HelloSign)

**Purpose**: E-signature document tracking

| Detail | Value |
|--------|-------|
| API Key | `3b1bada35cbb5e8d505571e191fc70ccd011a35d5dc8e9d94c257a6870732449` |
| Account | eddie.amintohir@compawnion.co |
| Env Variable | `HELLODOC_API_KEY` |
| Integration File | `server/hellodoc.ts` |
| Usage | Status check + document download only (no API send — cost saving) |

### Key API Calls Used

```typescript
// Check signature request status
GET https://api.hellosign.com/v3/signature_request/{signature_request_id}
Authorization: Basic base64(apiKey:)

// Download signed document
GET https://api.hellosign.com/v3/signature_request/files/{signature_request_id}
```

### What We Do NOT Use (Cost Saving)

The `POST /v3/signature_request/send` endpoint is intentionally not used. Users send documents manually through the Dropbox Sign website instead.

---

## OnlinePajak (E-Materai)

**Purpose**: Indonesian electronic stamp (e-Materai Rp 10.000)

| Detail | Value |
|--------|-------|
| API Key | `AYYYZh6Q4nJU3sRPqeAGGVLDA8KzNrRw` |
| Status | **PAUSED** — account not yet activated |
| Env Variable | Check `server/_core/env.ts` |
| API Docs | https://www.onlinepajak.com/api |

> [!warning] Do Not Implement Until Account Activated
> The OnlinePajak account must be activated before implementing. The E-Materai tab in ESignature.tsx is a placeholder.

---

## AWS S3

**Purpose**: All file storage (uploaded documents, signed documents, Excel templates)

| Detail | Value |
|--------|-------|
| Env Variables | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` |
| Helper File | `server/storage.ts` |
| Max Upload Size | 50MB |

### Usage Pattern

```typescript
import { storagePut, storageGet } from "./server/storage";

// Upload
const { url, key } = await storagePut(
  `documents/${userId}/${filename}-${randomSuffix()}.pdf`,
  fileBuffer,
  "application/pdf"
);

// Get presigned URL
const { url } = await storageGet(fileKey);
```

> [!important] S3 Bucket is Public
> The S3 bucket is configured as public, so returned URLs work directly without presigning. Always add random suffixes to file keys to prevent enumeration.

---

## Resend (Email)

**Purpose**: Transactional email notifications (workflow stage transitions, approvals)

| Detail | Value |
|--------|-------|
| Status | Configured and active |
| Usage | Stage transition notifications, approval requests |

---

## Supabase

**Purpose**: Authentication (OAuth) + PostgreSQL database

| Detail | Value |
|--------|-------|
| Env Variables | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` |
| Auth Restriction | @compawnion.co emails only |
| Database | PostgreSQL accessed via Drizzle ORM |

---

## File Upload Endpoint

```
POST /api/upload
Content-Type: multipart/form-data
Field name: file
Max size: 50MB
Accepted types: application/pdf, application/msword, 
                application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                application/vnd.ms-excel,
                application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

Response: { url: string, key: string }
```

Implemented in `server/_core/index.ts` using multer middleware.
