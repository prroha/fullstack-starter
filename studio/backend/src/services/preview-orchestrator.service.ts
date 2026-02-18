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

  // Idempotency check: read current status before attempting to provision
  const existing = await prisma.previewSession.findUnique({
    where: { sessionToken },
    select: { schemaStatus: true, schemaName: true },
  });

  if (!existing) {
    throw new Error("Preview session not found");
  }

  // If already provisioned, return the existing schema
  if (existing.schemaStatus === "READY" && existing.schemaName) {
    return { schemaName: existing.schemaName, status: "READY" };
  }

  // If already being provisioned by another request, signal conflict
  if (existing.schemaStatus === "PROVISIONING") {
    throw new Error("Provisioning already in progress for this session");
  }

  // Optimistic lock: only transition from PENDING to PROVISIONING.
  // If another request already changed the status, updateMany returns count=0.
  const updated = await prisma.previewSession.updateMany({
    where: { sessionToken, schemaStatus: "PENDING" },
    data: { schemaStatus: "PROVISIONING" },
  });

  if (updated.count === 0) {
    // Another request already started provisioning — re-read and handle
    const current = await prisma.previewSession.findUnique({
      where: { sessionToken },
      select: { schemaStatus: true, schemaName: true },
    });
    if (current?.schemaStatus === "READY" && current.schemaName) {
      return { schemaName: current.schemaName, status: "READY" };
    }
    throw new Error("Provisioning already in progress for this session");
  }

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
      const errorBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const errorObj = errorBody?.error as Record<string, unknown> | undefined;
      const errorMessage = errorObj?.message;
      throw new Error(typeof errorMessage === "string" ? errorMessage : `Provisioning failed with status ${res.status}`);
    }

    const responseBody = (await res.json()) as Record<string, unknown>;
    const data = responseBody?.data as Record<string, unknown> | undefined;
    if (!data || typeof data.schemaName !== "string") {
      throw new Error("Invalid response from preview backend: missing schemaName");
    }

    // Update session with schema info
    await prisma.previewSession.update({
      where: { sessionToken },
      data: {
        schemaName: data.schemaName,
        schemaStatus: "READY",
      },
    });

    return { schemaName: data.schemaName, status: "READY" };
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
  }).catch((err) => {
    console.error("[preview-orchestrator] Failed to drop schema:", err instanceof Error ? err.message : err);
  }); // Best effort
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
  }).catch((err) => {
    console.error("[preview-orchestrator] Failed to invalidate session:", err instanceof Error ? err.message : err);
  }); // Best effort
}
