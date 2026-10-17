import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { ApiError } from "../../utils/ApiError";
import { getAiConfig, isAiConfigured } from "./ai.config";

const AI_KEYS = [
  "AI_PROVIDER",
  "AI_MODEL",
  "AI_BASE_URL",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "AI_API_KEY",
  "OPENAI_BASE_URL",
];

let original: Record<string, string | undefined> = {};

beforeEach(() => {
  original = {};
  for (const key of AI_KEYS) {
    original[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of AI_KEYS) {
    if (original[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original[key];
    }
  }
});

describe("isAiConfigured", () => {
  it("is false when nothing is set", () => {
    expect(isAiConfigured()).toBe(false);
  });

  it("is false when the model is missing", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(isAiConfigured()).toBe(false);
  });

  it("is true when the provider key and model are set", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "gpt-4o-mini";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(isAiConfigured()).toBe(true);
  });
});

describe("getAiConfig", () => {
  it("throws a 503-style ApiError when the model is missing", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";

    expect(() => getAiConfig()).toThrow(ApiError);
  });

  it("throws when the provider key is missing", () => {
    process.env.AI_PROVIDER = "anthropic";
    process.env.AI_MODEL = "claude-3-5-sonnet";

    expect(() => getAiConfig()).toThrow(ApiError);
  });

  it("rejects an unsupported provider", () => {
    process.env.AI_PROVIDER = "definitely-not-a-provider";
    process.env.AI_MODEL = "x";
    process.env.AI_API_KEY = "test";

    expect(() => getAiConfig()).toThrow(ApiError);
  });

  it("requires a base URL for openai-compatible", () => {
    process.env.AI_PROVIDER = "openai-compatible";
    process.env.AI_MODEL = "llama-3";
    process.env.AI_API_KEY = "test";

    expect(() => getAiConfig()).toThrow(ApiError);
  });

  it("returns a valid config for openai-compatible with a base URL", () => {
    process.env.AI_PROVIDER = "openai-compatible";
    process.env.AI_MODEL = "llama-3";
    process.env.AI_API_KEY = "test";
    process.env.AI_BASE_URL = "http://localhost:11434/v1";

    const config = getAiConfig();
    expect(config.provider).toBe("openai-compatible");
    expect(config.model).toBe("llama-3");
    expect(config.baseURL).toBe("http://localhost:11434/v1");
  });
});
