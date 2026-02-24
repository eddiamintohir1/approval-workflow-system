/**
 * HelloDoc E-Signature API Integration
 * 
 * This module provides functions to interact with the HelloDoc API for e-signature workflows.
 * Documents are sent for signature, status is tracked, and signed documents are retrieved.
 */

const HELLODOC_API_URL = "https://api.hellodoc.id/v1"; // Replace with actual HelloDoc API URL
const HELLODOC_API_KEY = process.env.HELLODOC_API_KEY;

if (!HELLODOC_API_KEY) {
  throw new Error("HELLODOC_API_KEY environment variable is not set");
}

/**
 * Send a document to HelloDoc for e-signature
 * 
 * @param params Document details and signer information
 * @returns HelloDoc document ID and tracking information
 */
export async function sendDocumentForSignature(params: {
  documentUrl: string; // URL to the document (PDF) to be signed
  documentName: string;
  signerEmail: string;
  signerName: string;
  workflowId: string;
  callbackUrl?: string; // Optional webhook URL for status updates
}) {
  const response = await fetch(`${HELLODOC_API_URL}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HELLODOC_API_KEY}`,
    },
    body: JSON.stringify({
      document_url: params.documentUrl,
      document_name: params.documentName,
      signer: {
        email: params.signerEmail,
        name: params.signerName,
      },
      metadata: {
        workflow_id: params.workflowId,
      },
      callback_url: params.callbackUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HelloDoc API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    documentId: data.document_id,
    signatureUrl: data.signature_url, // URL where signer can sign the document
    status: data.status,
  };
}

/**
 * Check the signature status of a document
 * 
 * @param documentId HelloDoc document ID
 * @returns Current status and signed document URL if available
 */
export async function checkSignatureStatus(documentId: string) {
  const response = await fetch(`${HELLODOC_API_URL}/documents/${documentId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${HELLODOC_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HelloDoc API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    status: data.status, // "pending", "signed", "rejected", "expired"
    signedAt: data.signed_at ? new Date(data.signed_at) : null,
    signedDocumentUrl: data.signed_document_url, // URL to download signed PDF
    signerInfo: data.signer,
  };
}

/**
 * Download signed document from HelloDoc
 * 
 * @param signedDocumentUrl URL to the signed document
 * @returns Buffer containing the signed PDF
 */
export async function downloadSignedDocument(signedDocumentUrl: string): Promise<Buffer> {
  const response = await fetch(signedDocumentUrl, {
    headers: {
      "Authorization": `Bearer ${HELLODOC_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download signed document: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Cancel a pending signature request
 * 
 * @param documentId HelloDoc document ID
 */
export async function cancelSignatureRequest(documentId: string) {
  const response = await fetch(`${HELLODOC_API_URL}/documents/${documentId}/cancel`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HELLODOC_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HelloDoc API error: ${response.status} - ${error}`);
  }

  return { success: true };
}
