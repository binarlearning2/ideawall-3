import { describe, it, expect } from "vitest";
import { generateJoinCode, isValidJoinCodeFormat, clampText } from "@/lib/utils";

describe("generateJoinCode", () => {
  it("menghasilkan kode 6 karakter secara default", () => {
    expect(generateJoinCode()).toHaveLength(6);
  });

  it("tidak pernah menghasilkan karakter ambigu (0/O/1/I)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode();
      expect(code).not.toMatch(/[0O1I]/);
    }
  });

  it("bisa menghasilkan panjang custom", () => {
    expect(generateJoinCode(10)).toHaveLength(10);
  });
});

describe("isValidJoinCodeFormat", () => {
  it("menerima kode 6 karakter valid", () => {
    expect(isValidJoinCodeFormat("ABCD23")).toBe(true);
  });

  it("menerima kode huruf kecil (case-insensitive)", () => {
    expect(isValidJoinCodeFormat("abcd23")).toBe(true);
  });

  it("menolak kode dengan panjang salah", () => {
    expect(isValidJoinCodeFormat("ABCD2")).toBe(false);
    expect(isValidJoinCodeFormat("ABCD234")).toBe(false);
  });

  it("menolak kode dengan karakter ambigu", () => {
    expect(isValidJoinCodeFormat("ABCD0O")).toBe(false);
  });

  it("menolak string kosong", () => {
    expect(isValidJoinCodeFormat("")).toBe(false);
  });
});

describe("clampText", () => {
  it("mengembalikan teks yang sudah di-trim untuk input valid", () => {
    expect(clampText("  halo dunia  ", 50)).toBe("halo dunia");
  });

  it("mengembalikan null untuk string kosong/whitespace saja", () => {
    expect(clampText("", 50)).toBeNull();
    expect(clampText("   ", 50)).toBeNull();
  });

  it("mengembalikan null kalau melebihi maxLength", () => {
    expect(clampText("a".repeat(51), 50)).toBeNull();
  });

  it("menerima persis di batas maxLength", () => {
    expect(clampText("a".repeat(50), 50)).toBe("a".repeat(50));
  });

  it("mengembalikan null untuk tipe non-string", () => {
    expect(clampText(123, 50)).toBeNull();
    expect(clampText(null, 50)).toBeNull();
    expect(clampText(undefined, 50)).toBeNull();
  });
});
