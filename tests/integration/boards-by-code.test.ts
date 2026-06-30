import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMockClient } from "./helpers/mock-supabase";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { GET } from "@/app/api/boards/by-code/[joinCode]/route";

function makeRequest(ip = "1.2.3.4") {
  return new Request("http://localhost/api/boards/by-code/ABCD23", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("GET /api/boards/by-code/[joinCode]", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
  });

  it("menolak format kode yang tidak valid (400) tanpa query ke database", async () => {
    const mockClient = buildMockClient({ fromResponses: [] });
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const response = await GET(makeRequest("9.9.9.1"), { params: { joinCode: "AB" } });
    expect(response.status).toBe(400);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("mengembalikan 404 kalau board tidak ditemukan", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({ fromResponses: [{ data: null, error: null }] }) as never
    );

    const response = await GET(makeRequest("9.9.9.2"), { params: { joinCode: "ZZZZ99" } });
    expect(response.status).toBe(404);
  });

  it("mengembalikan metadata board (bukan data sensitif) kalau ditemukan", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          {
            data: {
              id: "board-1",
              title: "Workshop Ideation Q3",
              status: "active",
              is_anonymous: true,
              join_code: "ABCD23",
            },
            error: null,
          },
        ],
      }) as never
    );

    const response = await GET(makeRequest("9.9.9.3"), { params: { joinCode: "ABCD23" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("board-1");
    expect(data.owner_id).toBeUndefined();
  });

  it("membatasi request yang berlebihan dari IP yang sama (429)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: Array.from({ length: 35 }, () => ({
          data: { id: "board-1", title: "X", status: "active", is_anonymous: true, join_code: "ABCD23" },
          error: null,
        })),
      }) as never
    );

    let lastResponse;
    for (let i = 0; i < 31; i++) {
      lastResponse = await GET(makeRequest("8.8.8.8"), { params: { joinCode: "ABCD23" } });
    }

    expect(lastResponse!.status).toBe(429);
  });
});
