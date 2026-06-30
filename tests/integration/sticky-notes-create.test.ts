import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMockClient } from "./helpers/mock-supabase";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/sections/[sectionId]/sticky-notes/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/sections/section-1/sticky-notes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const activeWallSection = {
  id: "section-1",
  type: "wall",
  board_id: "board-1",
  boards: { status: "active" },
};

describe("POST /api/sections/[sectionId]/sticky-notes", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset();
  });

  it("mengembalikan 404 kalau section tidak ditemukan", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({ fromResponses: [{ data: null, error: null }] }) as never
    );

    const response = await POST(makeRequest({ content: "Ide", author_name: "Budi", author_session_id: "s-404" }), {
      params: { sectionId: "section-1" },
    });
    expect(response.status).toBe(404);
  });

  it("menolak posting ke board yang sudah diarsipkan (403)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [{ data: { ...activeWallSection, boards: { status: "archived" } }, error: null }],
      }) as never
    );

    const response = await POST(
      makeRequest({ content: "Ide", author_name: "Budi", author_session_id: "s-archived" }),
      { params: { sectionId: "section-1" } }
    );
    expect(response.status).toBe(403);
  });

  it("menolak request tanpa content (400)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({ fromResponses: [{ data: activeWallSection, error: null }] }) as never
    );

    const response = await POST(
      makeRequest({ author_name: "Budi", author_session_id: "s-no-content" }),
      { params: { sectionId: "section-1" } }
    );
    expect(response.status).toBe(400);
  });

  it("menolak content lebih dari 280 karakter (400)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({ fromResponses: [{ data: activeWallSection, error: null }] }) as never
    );

    const response = await POST(
      makeRequest({
        content: "a".repeat(281),
        author_name: "Budi",
        author_session_id: "s-too-long",
      }),
      { params: { sectionId: "section-1" } }
    );
    expect(response.status).toBe(400);
  });

  it("menolak quadrant_index untuk section bertipe wall hanya kalau section matrix tanpa quadrant", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          { data: { ...activeWallSection, type: "matrix" }, error: null },
        ],
      }) as never
    );

    const response = await POST(
      makeRequest({ content: "Ide", author_name: "Budi", author_session_id: "s-matrix-no-q" }),
      { params: { sectionId: "section-1" } }
    );
    expect(response.status).toBe(400);
  });

  it("membuat sticky note baru di section Wall (201)", async () => {
    const newNote = {
      id: "note-1",
      board_id: "board-1",
      section_id: "section-1",
      content: "Ide brilian saya",
      color: "#FFF59D",
      author_name: "Budi",
      author_session_id: "s-success",
      position_x: 0.5,
      position_y: 0.5,
      quadrant_index: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({
        fromResponses: [
          { data: activeWallSection, error: null },
          { data: newNote, error: null },
        ],
      }) as never
    );

    const response = await POST(
      makeRequest({
        content: "Ide brilian saya",
        color: "#FFF59D",
        author_name: "Budi",
        author_session_id: "s-success",
      }),
      { params: { sectionId: "section-1" } }
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.content).toBe("Ide brilian saya");
    expect(data.author_name).toBe("Budi");
  });

  it("membatasi spam sticky note dari session_id yang sama (429)", async () => {
    const sessionId = "s-rate-limit-test";

    // 10 percobaan pertama lolos rate limit (masing-masing: lookup section + insert note),
    // percobaan ke-11 kena rate limit sebelum sempat insert (cuma butuh 1 lookup section).
    const responses = [];
    for (let i = 0; i < 10; i++) {
      responses.push({ data: activeWallSection, error: null });
      responses.push({
        data: { id: `note-${i}`, content: `Ide ke-${i}` },
        error: null,
      });
    }
    responses.push({ data: activeWallSection, error: null });

    vi.mocked(createAdminClient).mockReturnValue(
      buildMockClient({ fromResponses: responses }) as never
    );

    let lastResponse;
    for (let i = 0; i < 11; i++) {
      lastResponse = await POST(
        makeRequest({ content: `Ide ke-${i}`, author_name: "Budi", author_session_id: sessionId }),
        { params: { sectionId: "section-1" } }
      );
    }

    expect(lastResponse!.status).toBe(429);
  });
});
