import { describe, expect, it } from "vitest";
import {
  formatDocumentNumber,
  getMonthRoman,
} from "./routers/documentSequence";

describe("Document Sequence Generator", () => {
  it("formats document numbers", () => {
    expect(formatDocumentNumber(1, "SOP", "CJB", "MKT", "III", 2026)).toBe(
      "0001.SOP/CJB/MKT/III/2026"
    );
  });

  it("converts month numbers to Roman numerals", () => {
    expect(getMonthRoman(1)).toBe("I");
    expect(getMonthRoman(3)).toBe("III");
    expect(getMonthRoman(12)).toBe("XII");
  });

  it("rejects invalid month numbers", () => {
    expect(() => getMonthRoman(0)).toThrow("Invalid month number");
    expect(() => getMonthRoman(13)).toThrow("Invalid month number");
  });
});
