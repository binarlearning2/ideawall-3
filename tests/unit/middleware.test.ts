import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "../../middleware";

const getUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser,
    },
  })),
}));

describe("middleware", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    getUser.mockReset();
  });

  it("does not invoke Supabase auth when env vars are missing", async () => {
    const headers = new Headers();
    const request = new NextRequest(new Request("https://example.com/", { headers }));

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(getUser).not.toHaveBeenCalled();
  });
});
