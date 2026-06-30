import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMockClient } from "./helpers/mock-supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/boards/route";

describe("POST /api/boards", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("menolak request tanpa user yang login (401)", async () => {
    vi.mocked(createClient).mockReturnValue(
      buildMockClient({ user: null, fromResponses: [] }) as never
    );

    const request = new Request("http://localhost/api/boards", {
      method: "POST",
      body: JSON.stringify({ title: "Workshop Ideation Q3" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("menolak request tanpa title (400)", async () => {
    vi.mocked(createClient).mockReturnValue(
      buildMockClient({ user: { id: "user-1" }, fromResponses: [] }) as never
    );

    const request = new Request("http://localhost/api/boards", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("membuat board baru dan mengembalikan data lengkap (201)", async () => {
    const boardRow = {
      id: "board-1",
      owner_id: "user-1",
      title: "Workshop Ideation Q3",
      description: null,
      join_code: "ABCD23",
      is_anonymous: true,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(createClient).mockReturnValue(
      buildMockClient({
        user: { id: "user-1" },
        fromResponses: [{ data: boardRow, error: null }],
      }) as never
    );

    const request = new Request("http://localhost/api/boards", {
      method: "POST",
      body: JSON.stringify({ title: "Workshop Ideation Q3" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("Workshop Ideation Q3");
    expect(data.id).toBeDefined();
    expect(data.join_code).toBe("ABCD23");
  });

  it("mengembalikan 400 untuk body JSON yang tidak valid", async () => {
    vi.mocked(createClient).mockReturnValue(
      buildMockClient({ user: { id: "user-1" }, fromResponses: [] }) as never
    );

    const request = new Request("http://localhost/api/boards", {
      method: "POST",
      body: "not json",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
