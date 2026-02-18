import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";

/**
 * Sign an outgoing internal API request with HMAC-SHA256.
 */
function createSignedHeaders(
  secret: string,
  method: string,
  path: string,
  body: string
): Record<string, string> {
  const timestamp = Date.now();
  const payload = `${method}:${path}:${body}:${timestamp}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return {
    "X-Internal-Signature": signature,
    "X-Internal-Timestamp": String(timestamp),
    "Content-Type": "application/json",
  };
}

export async function provisionPreviewSchema(
  sessionToken: string,
  features: string[],
  tier: string,
): Promise<{ schemaName: string; status: string }> {
  if (!env.PREVIEW_BACKEND_URL || !env.INTERNAL_API_SECRET) {
    throw new Error("Preview backend not configured");
  }

  // Update status to PROVISIONING
  await prisma.previewSession.update({
    where: { sessionToken },
    data: { schemaStatus: "PROVISIONING" },
  });

  const body = JSON.stringify({ sessionToken, features, tier });
  const path = "/internal/schemas/provision";
  const headers = createSignedHeaders(
    env.INTERNAL_API_SECRET,
    "POST",
    path,
    body,
  );

  try {
    const res = await fetch(`${env.PREVIEW_BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: { message: "Unknown error" } })) as {
        error?: { message?: string };
      };
      throw new Error(errorBody.error?.message || `Provisioning failed with status ${res.status}`);
    }

    const responseBody = await res.json() as { data: { schemaName: string } };

    // Update session with schema info
    await prisma.previewSession.update({
      where: { sessionToken },
      data: {
        schemaName: responseBody.data.schemaName,
        schemaStatus: "READY",
      },
    });

    return { schemaName: responseBody.data.schemaName, status: "READY" };
  } catch (error) {
    // Mark as failed
    await prisma.previewSession.update({
      where: { sessionToken },
      data: { schemaStatus: "FAILED" },
    });
    throw error;
  }
}

export async function dropPreviewSchema(schemaName: string): Promise<void> {
  if (!env.PREVIEW_BACKEND_URL || !env.INTERNAL_API_SECRET) return;

  const path = `/internal/schemas/${schemaName}`;
  const headers = createSignedHeaders(
    env.INTERNAL_API_SECRET,
    "DELETE",
    path,
    "{}",
  );

  await fetch(`${env.PREVIEW_BACKEND_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  }).catch(() => {}); // Best effort
}

export async function invalidatePreviewSession(sessionToken: string): Promise<void> {
  if (!env.PREVIEW_BACKEND_URL || !env.INTERNAL_API_SECRET) return;

  const body = JSON.stringify({ sessionToken });
  const path = "/internal/sessions/invalidate";
  const headers = createSignedHeaders(
    env.INTERNAL_API_SECRET,
    "POST",
    path,
    body,
  );

  await fetch(`${env.PREVIEW_BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  }).catch(() => {}); // Best effort
}
