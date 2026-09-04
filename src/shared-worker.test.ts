import { describe, expect, it } from "vitest";
import worker from "../server/worker";

type Row = Record<string, unknown>;

class FakeD1 {
  rows = new Map<string, Row>();

  prepare(sql: string) {
    return new FakeStatement(this, sql);
  }
}

class FakeStatement {
  private values: unknown[] = [];
  constructor(private db: FakeD1, private sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async first<T>() {
    return (this.db.rows.get(String(this.values[0])) ?? null) as T | null;
  }
  async run() {
    if (this.sql.startsWith("INSERT")) {
      const [id, stateJson, customerHash, ownerHash, revision, createdAt, updatedAt] = this.values;
      this.db.rows.set(String(id), {
        id, state_json: stateJson, customer_token_hash: customerHash, owner_token_hash: ownerHash,
        revision, storage_version: 1, created_at: createdAt, updated_at: updatedAt,
      });
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("UPDATE")) {
      const [stateJson, revision, updatedAt, id, expectedStorageVersion] = this.values;
      const row = this.db.rows.get(String(id));
      if (!row || row.storage_version !== expectedStorageVersion) return { meta: { changes: 0 } };
      this.db.rows.set(String(id), {
        ...row,
        state_json: stateJson,
        revision,
        updated_at: updatedAt,
        storage_version: Number(row.storage_version) + 1,
      });
      return { meta: { changes: 1 } };
    }
    throw new Error(`Unexpected SQL: ${this.sql}`);
  }
}

async function call(db: FakeD1, body: Record<string, unknown>) {
  const response = await worker.fetch(new Request("https://shared.test/api/cases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }), { DB: db } as never);
  return { status: response.status, body: await response.json() as Record<string, any> };
}

describe("shared two-chat case service", () => {
  it("keeps one durable case role-scoped and wakes the customer after a human-sent owner offer", async () => {
    const db = new FakeD1();
    const opened = await call(db, {
      action: "open",
      command: {
        type: "OPEN_CASE",
        serviceId: "ac-diagnostic",
        problemSummary: "AC is blowing warm air.",
        postcode: "60614",
        urgency: "same_day",
        preferredWindows: ["Today, 2–4 PM"],
        constraints: ["Approval before changed work"],
        serviceLocation: "Lincoln Park, Chicago, IL 60614",
        locationPrecision: "area",
        locationConsentConfirmed: true,
      },
    });
    expect(opened.status).toBe(201);
    const caseId = opened.body.result.caseId as string;
    const customer = opened.body.capabilities.customer as string;
    const owner = opened.body.capabilities.owner as string;

    const staged = await call(db, {
      action: "command", caseId, accessToken: owner, role: "owner", human: false,
      command: {
        type: "STAGE_OFFER", caseId, expectedRevision: 1, totalCents: 19500,
        arrivalWindow: "Today, 2–4 PM", includedScope: ["Diagnostic labour"], exclusions: ["Parts"],
        depositCents: 4900, warrantyDays: 30, expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      },
    });
    expect(staged.body.result.code).toBe("AWAITING_HUMAN");
    expect(staged.body.state.cases[0].ownerDraft.kind).toBe("offer");

    const customerRead = await call(db, { action: "read", caseId, accessToken: customer, role: "customer" });
    expect(customerRead.body.state.cases[0]).not.toHaveProperty("ownerDraft");

    const sent = await call(db, {
      action: "command", caseId, accessToken: owner, role: "owner", human: true,
      command: { type: "SEND_OFFER", caseId },
    });
    expect(sent.body.result.afterRevision).toBe(2);

    const waited = await call(db, {
      action: "wait", caseId, accessToken: customer, role: "customer", afterRevision: 1, maxWaitSeconds: 1,
    });
    expect(waited.body.result.code).toBe("OK");
    expect(waited.body.state.cases[0].offers[0].totalCents).toBe(19500);

    const timedOut = await call(db, {
      action: "wait", caseId, accessToken: customer, role: "customer", afterRevision: 2, maxWaitSeconds: 1,
    });
    expect(timedOut.body.result.code).toBe("STILL_WAITING");
    expect(timedOut.body.result.data.waitCompleted).toBe(true);
    expect(timedOut.body.result.nextActions).toEqual(["Return control to the user. Check the case again only when the user asks."]);
  });
});
