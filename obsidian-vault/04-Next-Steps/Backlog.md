---
title: Backlog
tags: [backlog, next-steps, todo]
---

# Backlog & Next Steps

## High Priority

### E-Materai Integration (OnlinePajak)

**Status**: Paused — awaiting OnlinePajak account activation.

When the account is activated, implement the following:
- Webhook endpoint to receive stamp completion callbacks from OnlinePajak
- UI in the E-Materai tab of the E-Signature page (currently a placeholder)
- Stamp type selection (MateraI Rp 10.000)
- Recipient details form
- Status tracking (similar to e-signature)
- API key is already stored in env: `AYYYZh6Q4nJU3sRPqeAGGVLDA8KzNrRw`
- OnlinePajak API docs: https://www.onlinepajak.com/api

**Developer Prompt for E-Materai**:
```
Implement E-Materai integration using OnlinePajak API. The API key is already stored in the environment variable. The E-Materai tab already exists in client/src/pages/ESignature.tsx as a placeholder. Implement: (1) stamp request form with document upload, stamp type selection, and recipient details, (2) POST to OnlinePajak API to initiate stamping, (3) webhook endpoint at /api/ematerai/webhook to receive completion callbacks, (4) status tracking in a new ematerai_documents table (similar to signed_documents), (5) download link for stamped document. White-label: do not mention OnlinePajak in the UI — use "Compawnion's E-Stamp Service".
```

## Medium Priority

### Workflow Visualization

Add visual timeline and progress indicators to workflow detail pages:
- Horizontal step indicator showing all stages
- Current stage highlighted
- Completed stages marked with checkmark
- Rejected stages marked with X
- Approval history with timestamps and approver names
- Consider using a Mermaid diagram or custom SVG

### Dashboard Analytics Charts

Upgrade the Analytics page with real Chart.js/D3.js visualizations:
- Workflow completion rate over time (line chart)
- Workflows by department (bar chart)
- Approval turnaround time (histogram)
- Status distribution (donut chart)
- Top bottleneck stages (horizontal bar)

All data should come from existing `workflows`, `workflow_stages`, and `workflow_approvals` tables.

## Low Priority

### Bulk E-Signature

Allow sending one document to multiple signers simultaneously via the Dropbox Sign API's bulk send feature.

### Mobile Responsive Improvements

The current UI is desktop-first. Improve mobile layout for:
- Sidebar (currently uses collapsible but not fully mobile-optimized)
- Workflow detail pages
- Document upload flow

### Vendor Portal

A limited-access portal for external vendors to:
- View PO documents sent to them
- Sign documents
- Track order status

## Completed (Reference)

See [[../03-Progress/Changelog]] for full history of completed features.
