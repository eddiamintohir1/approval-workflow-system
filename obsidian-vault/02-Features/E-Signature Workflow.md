---
title: E-Signature Workflow
tags: [feature, e-signature, dropbox-sign, hellodoc]
status: implemented
---

# E-Signature Workflow

## Overview

The e-signature feature uses a **hybrid approach** to minimize API costs. Documents are uploaded to S3, manually sent via the Dropbox Sign website (giving full control over signature field placement), and then tracked via API.

> [!tip] Why Hybrid?
> Sending documents via the Dropbox Sign API costs money per document. By having users send manually through the website (free), we only use the API for status checking (cheap/free read-only calls).

## Workflow Steps

```
1. User uploads document in WFMT
       ↓ (uploads to AWS S3)
2. System creates record with status: awaiting_hellodoc_id
       ↓
3. User downloads the document from WFMT
       ↓
4. User opens Dropbox Sign website (hellosign.com)
       ↓
5. User creates signature request manually
   (full control over field placement)
       ↓
6. User copies the Document ID from Dropbox Sign
       ↓
7. User pastes Document ID back into WFMT
       ↓ (status changes to: pending)
8. Signer receives email from Dropbox Sign
       ↓
9. User clicks "Check Status" in WFMT
       ↓ (polls Dropbox Sign API)
10. When signed → status changes to: signed
```

## Status Values

| Status | Meaning |
|--------|---------|
| `awaiting_hellodoc_id` | Document uploaded, waiting for Dropbox Sign ID to be entered |
| `pending` | Dropbox Sign ID entered, waiting for signer |
| `signed` | Document has been signed |
| `rejected` | Signer declined |
| `expired` | Signature request expired |

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/ESignature.tsx` | Main UI — tabs for E-Sign and E-Materai |
| `client/src/pages/DocumentQueue.tsx` | CFO/Admin view of all documents |
| `client/src/pages/DocumentTemplates.tsx` | Template library CRUD |
| `server/hellodoc.ts` | Dropbox Sign API integration |
| `server/routers/signedDocuments.ts` | tRPC procedures for e-signature |

## API Credentials

- **Dropbox Sign API Key**: stored in the deployment secret manager; never commit the value
- **Account**: eddie.amintohir@compawnion.co (verified)
- **Env variable**: `HELLODOC_API_KEY`

## tRPC Procedures

| Procedure | Purpose |
|-----------|---------|
| `signedDocuments.createDocument` | Upload-only, creates record |
| `signedDocuments.updateHelloDocId` | Enter Dropbox Sign ID after manual send |
| `signedDocuments.checkStatus` | Poll Dropbox Sign API for status |
| `signedDocuments.getAll` | Get all documents (Admin/CFO) |
| `signedDocuments.getBySender` | Get documents by current user |

## File Upload Endpoint

```
POST /api/upload
Content-Type: multipart/form-data
Max size: 50MB
Accepted: PDF, Word (.doc/.docx), Excel (.xls/.xlsx)
Returns: { url: string, key: string }
```

## E-Materai Tab (Paused)

The E-Signature page has two tabs:
1. **E-Sign** — fully implemented (hybrid workflow above)
2. **E-Materai** — placeholder UI only

> [!warning] E-Materai Status
> OnlinePajak account has not been activated yet. API key is stored (`AYYYZh6Q4nJU3sRPqeAGGVLDA8KzNrRw` in env `HELLODOC_API_KEY` or separate env). Do not implement until the account is confirmed active.
> 
> When ready to implement:
> - OnlinePajak API docs: https://www.onlinepajak.com/api
> - Need webhook endpoint for stamp completion callbacks
> - UI needs stamp type selection and recipient details

## Document Queue (CFO/Admin)

The `/cfo-document-queue` page shows all uploaded documents with:
- Document name
- Uploader email
- Upload date
- Signer email
- Download link (direct S3 URL)
- Status badge

This allows CFO/Admin to manually process documents in Dropbox Sign without needing to log into the system as each individual user.
