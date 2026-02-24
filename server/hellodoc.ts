/**
 * Dropbox Sign (HelloSign) E-Signature API Integration
 * 
 * This module provides functions to interact with the Dropbox Sign API for e-signature workflows.
 * Documents are sent for signature, status is tracked, and signed documents are retrieved.
 * 
 * API Documentation: https://developers.hellosign.com/api/reference/
 */

const DROPBOX_SIGN_API_URL = "https://api.hellosign.com/v3";
const HELLODOC_API_KEY = process.env.HELLODOC_API_KEY;

if (!HELLODOC_API_KEY) {
  throw new Error("HELLODOC_API_KEY environment variable is not set");
}

/**
 * Check the signature status of a document
 * 
 * @param signatureRequestId Dropbox Sign signature request ID
 * @returns Current status and signed document URL if available
 */
export async function checkSignatureStatus(signatureRequestId: string) {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/signature_request/${signatureRequestId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox Sign API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const signatureRequest = data.signature_request;
  
  // Map Dropbox Sign status to our status
  let status = "pending";
  if (signatureRequest.is_complete) {
    status = "signed";
  } else if (signatureRequest.is_declined) {
    status = "rejected";
  } else if (signatureRequest.has_error) {
    status = "expired";
  }

  return {
    status,
    signedAt: signatureRequest.is_complete ? new Date() : null,
    signedDocumentUrl: signatureRequest.is_complete ? signatureRequest.files_url : null,
    signerInfo: signatureRequest.signatures?.[0] || null,
  };
}

/**
 * Download signed document from Dropbox Sign
 * 
 * @param signatureRequestId Dropbox Sign signature request ID
 * @returns Buffer containing the signed PDF
 */
export async function downloadSignedDocument(signatureRequestId: string): Promise<Buffer> {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/signature_request/files/${signatureRequestId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download signed document: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get account information (for testing API key)
 * 
 * @returns Account information
 */
export async function getAccountInfo() {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/account`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox Sign API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.account;
}

/**
 * Cancel a pending signature request
 * 
 * @param signatureRequestId Dropbox Sign signature request ID
 */
export async function cancelSignatureRequest(signatureRequestId: string) {
  const response = await fetch(`${DROPBOX_SIGN_API_URL}/signature_request/cancel/${signatureRequestId}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(HELLODOC_API_KEY + ":").toString("base64")}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox Sign API error: ${response.status} - ${error}`);
  }

  return { success: true };
}
