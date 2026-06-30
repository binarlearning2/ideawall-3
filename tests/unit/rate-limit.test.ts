import { describe, it, expect } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  it("tidak membatasi request pertama", () => {
    expect(isRateLimited("user-a-test-1", 3, 60_000)).toBe(false);
  });

  it("membatasi setelah melewati jumlah maksimum dalam window", () => {
    const key = "user-b-test-1";
    expect(isRateLimited(key, 2, 60_000)).toBe(false);
    expect(isRateLimited(key, 2, 60_000)).toBe(false);
    expect(isRateLimited(key, 2, 60_000)).toBe(true);
  });

  it("key yang berbeda punya hitungan terpisah", () => {
    expect(isRateLimited("user-c-test-1", 1, 60_000)).toBe(false);
    expect(isRateLimited("user-d-test-1", 1, 60_000)).toBe(false);
  });
});
