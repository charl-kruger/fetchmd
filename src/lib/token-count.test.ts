import { describe, expect, it } from "vitest";
import {
  estimateTokenCount,
  resolveTokenEncoding,
} from "./token-count.js";

describe("token-count", () => {
  it("returns 0 for empty input", () => {
    expect(estimateTokenCount("")).toBe(0);
    expect(estimateTokenCount("   ")).toBe(0);
  });

  it("uses o200k_base by default", () => {
    expect(resolveTokenEncoding()).toBe("o200k_base");
    expect(resolveTokenEncoding({})).toBe("o200k_base");
  });

  it("resolves encoding from model when provided", () => {
    expect(resolveTokenEncoding({ tokenModel: "gpt-4o-mini" })).toBe("o200k_base");
    expect(resolveTokenEncoding({ tokenModel: "text-embedding-3-large" })).toBe(
      "cl100k_base",
    );
  });

  it("lets explicit tokenEncoding override model mapping", () => {
    expect(
      resolveTokenEncoding({
        tokenModel: "gpt-4o-mini",
        tokenEncoding: "cl100k_base",
      }),
    ).toBe("cl100k_base");
  });

  it("matches known tokenizer behavior for multilingual text", () => {
    // Values from OpenAI cookbook examples:
    // https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken
    const text = "お誕生日おめでとう";

    expect(estimateTokenCount(text, { tokenEncoding: "cl100k_base" })).toBe(9);
    expect(estimateTokenCount(text, { tokenEncoding: "o200k_base" })).toBe(8);
  });
});
