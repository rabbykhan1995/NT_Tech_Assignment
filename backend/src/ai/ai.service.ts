import { generateText } from "ai";

import { ApiError } from "../../utils/ApiError";
import DashboardRepository from "../dashboard/dashboard.repo";
import { getAiConfig, getLanguageModel, isAiConfigured } from "./ai.config";
import {
  AI_SYSTEM_PROMPT,
  assessProducts,
  buildAnalysisPrompt,
  type AnalysisPayload,
  type ProductSnapshot,
  type SupplierTerm,
} from "./ai.analysis";

export default class AiService {
  /**
   * Gathers the authoritative business data and computes deterministic
   * indicators. This is the source of truth for the AI layer.
   */
  static async collectBusinessData(): Promise<{
    products: ProductSnapshot[];
    payload: AnalysisPayload;
  }> {
    const [salesHistory, supplierPrices] = await Promise.all([
      DashboardRepository.salesHistoryByProduct(50),
      DashboardRepository.supplierProductPrices(),
    ]);

    const termsByProduct = new Map<number, SupplierTerm[]>();

    for (const row of supplierPrices) {
      const list = termsByProduct.get(row.productID) ?? [];
      list.push({
        supplierID: row.supplierID,
        supplierName: row.supplier?.name ?? null,
        purchasePrice: Number(row.purchasePrice),
        leadTimeDays: Number(row.leadTimeDays),
        minOrderQty: Number(row.minOrderQty),
        isPreferred: Boolean(row.isPreferred),
      });
      termsByProduct.set(row.productID, list);
    }

    const products: ProductSnapshot[] = salesHistory.map((row) => ({
      productID: row.productID,
      productName: row.productName,
      stock: Number(row.stock),
      alertQty: Number(row.alertQty),
      purchasePrice: Number(row.purchasePrice),
      salePrice: Number(row.salePrice),
      totalSold: Number(row.totalSold),
      revenue: Number(row.revenue),
      suppliers: termsByProduct.get(row.productID) ?? [],
    }));

    const assessed = assessProducts(products);

    const payload: AnalysisPayload = {
      generatedAt: new Date().toISOString(),
      totals: {
        products: assessed.length,
        outOfStock: assessed.filter((p) => p.stockStatus === "out_of_stock").length,
        lowStock: assessed.filter((p) => p.stockStatus === "low").length,
      },
      products: assessed,
    };

    return { products, payload };
  }

  /**
   * Runs the AI analysis. All numbers in the response come from the
   * deterministic `payload`; the model only explains and recommends.
   *
   * Provider failures produce a controlled error and never a fabricated
   * result. Core ERP operations never call this method.
   */
  static async analyze(input?: { question?: string }) {
    if (!isAiConfigured()) {
      throw new ApiError(
        503,
        "AI analysis is not configured. Set AI_PROVIDER, AI_MODEL and the matching API key.",
      );
    }

    const config = getAiConfig();
    const { payload } = await this.collectBusinessData();

    let analysis: string;
    try {
      const result = await generateText({
        model: getLanguageModel(config),
        system: AI_SYSTEM_PROMPT,
        prompt: buildAnalysisPrompt(payload, input?.question),
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(30_000),
      });
      analysis = result.text;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown AI provider error";
      throw new ApiError(502, `AI analysis failed: ${message}`);
    }

    if (!analysis || !analysis.trim()) {
      throw new ApiError(502, "The AI provider returned an empty response");
    }

    return {
      analysis,
      provider: config.provider,
      model: config.model,
      generatedAt: payload.generatedAt,
      // The values the explanation is based on, so a recommendation is always
      // traceable to a deterministic calculation.
      metrics: payload,
      disclaimer:
        "Recommendations are AI-generated interpretations. Stock, prices and totals are calculated by the backend and are authoritative.",
    };
  }
}
