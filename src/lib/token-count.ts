import { Tiktoken, getEncodingNameForModel } from "js-tiktoken/lite";
import type { TiktokenBPE } from "js-tiktoken/lite";
import cl100kBase from "js-tiktoken/ranks/cl100k_base";
import o200kBase from "js-tiktoken/ranks/o200k_base";

export type SupportedTokenEncoding = "cl100k_base" | "o200k_base";

export interface TokenEstimateOptions {
  tokenModel?: string;
  tokenEncoding?: SupportedTokenEncoding;
}

const DEFAULT_TOKEN_ENCODING: SupportedTokenEncoding = "o200k_base";

const RANKS_BY_ENCODING: Record<SupportedTokenEncoding, TiktokenBPE> = {
  cl100k_base: cl100kBase,
  o200k_base: o200kBase,
};

const encoderCache: Partial<Record<SupportedTokenEncoding, Tiktoken>> = {};

function getEncoder(encoding: SupportedTokenEncoding): Tiktoken {
  const existing = encoderCache[encoding];
  if (existing) {
    return existing;
  }

  const created = new Tiktoken(RANKS_BY_ENCODING[encoding]);
  encoderCache[encoding] = created;
  return created;
}

function isSupportedTokenEncoding(value: string): value is SupportedTokenEncoding {
  return value === "cl100k_base" || value === "o200k_base";
}

function resolveEncodingFromModel(model: string): SupportedTokenEncoding {
  try {
    const resolved = getEncodingNameForModel(model as never);
    if (isSupportedTokenEncoding(resolved)) {
      return resolved;
    }
  } catch {
    // Fallback to prefix heuristics for unknown or newer aliases.
  }

  const normalized = model.trim().toLowerCase();

  if (
    normalized.startsWith("gpt-5") ||
    normalized.startsWith("gpt-4.5") ||
    normalized.startsWith("gpt-4.1") ||
    normalized.startsWith("gpt-4o") ||
    normalized.startsWith("chatgpt-4o") ||
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.startsWith("o4")
  ) {
    return "o200k_base";
  }

  if (
    normalized.startsWith("gpt-4") ||
    normalized.startsWith("gpt-3.5") ||
    normalized.startsWith("gpt-35") ||
    normalized.startsWith("text-embedding-3") ||
    normalized.startsWith("text-embedding-ada")
  ) {
    return "cl100k_base";
  }

  return DEFAULT_TOKEN_ENCODING;
}

export function resolveTokenEncoding(
  options: TokenEstimateOptions = {},
): SupportedTokenEncoding {
  if (options.tokenEncoding) {
    return options.tokenEncoding;
  }

  if (options.tokenModel) {
    return resolveEncodingFromModel(options.tokenModel);
  }

  return DEFAULT_TOKEN_ENCODING;
}

export function estimateTokenCount(
  text: string,
  options: TokenEstimateOptions = {},
): number {
  const compact = text.trim();
  if (!compact) {
    return 0;
  }

  const encoding = resolveTokenEncoding(options);
  const encoder = getEncoder(encoding);
  return encoder.encode(compact).length;
}
