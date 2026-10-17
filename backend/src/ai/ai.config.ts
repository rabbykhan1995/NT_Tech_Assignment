import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

import { ApiError } from "../../utils/ApiError";

/**
 * Supported AI providers and the environment variable that holds their key.
 *
 * `openai-compatible` covers providers that expose an OpenAI-compatible HTTP
 * API (OpenRouter, Groq, Together, local vLLM/Ollama, ...). Providers with a
 * different protocol are NOT interchangeable — add a dedicated adapter here
 * if a new one is needed.
 */
export const AI_PROVIDERS = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  "openai-compatible": "AI_API_KEY",
} as const;

export type AiProvider = keyof typeof AI_PROVIDERS;

export interface AiConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
}

function readProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "openai").trim().toLowerCase();
  if (!(raw in AI_PROVIDERS)) {
    throw new ApiError(
      500,
      `Unsupported AI_PROVIDER "${raw}". Supported: ${Object.keys(AI_PROVIDERS).join(", ")}`,
    );
  }
  return raw as AiProvider;
}

/**
 * Reads and validates the AI configuration. Throws a clear 500 `ApiError`
 * when required values are missing. Never returns or logs the API key.
 */
export function getAiConfig(): AiConfig {
  const provider = readProvider();

  const model = process.env.AI_MODEL?.trim();
  if (!model) {
    throw new ApiError(
      500,
      "AI_MODEL is not configured. Set AI_PROVIDER, AI_MODEL and the matching API key.",
    );
  }

  const keyVar = AI_PROVIDERS[provider];
  const apiKey = process.env[keyVar]?.trim();
  if (!apiKey) {
    throw new ApiError(
      500,
      `AI is not configured: ${keyVar} is missing for provider "${provider}".`,
    );
  }

  const baseURL =
    process.env.AI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    undefined;

  if (provider === "openai-compatible" && !baseURL) {
    throw new ApiError(
      500,
      'AI_BASE_URL is required when AI_PROVIDER is "openai-compatible".',
    );
  }

  return { provider, model, apiKey, baseURL };
}

/** True when the minimum AI configuration is present. Never throws. */
export function isAiConfigured(): boolean {
  try {
    getAiConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds the provider-specific language model. Provider selection is isolated
 * here so business logic never imports a provider SDK directly.
 */
export function getLanguageModel(config: AiConfig = getAiConfig()): LanguageModel {
  switch (config.provider) {
    case "openai": {
      const openai = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      return openai(config.model);
    }

    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      return anthropic(config.model);
    }

    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
      return google(config.model);
    }

    case "openai-compatible": {
      const compatible = createOpenAICompatible({
        name: "custom",
        apiKey: config.apiKey,
        baseURL: config.baseURL!,
      });
      return compatible(config.model);
    }
  }
}
