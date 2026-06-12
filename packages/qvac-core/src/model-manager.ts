/**
 * ModelManager — singleton that owns the QVAC model lifecycle.
 *
 * Updated for SDK v0.11.x:
 *   - loadModel accepts direct HuggingFace HTTPS URLs
 *   - Built-in constants (e.g. GTE_LARGE_FP16) resolved from SDK exports
 *   - Progress callback shape updated (progress object with .percentage)
 *   - getLoadedModelInfo() used for status introspection
 */

import type { ModelStatus, ModelType } from "@qvac-health/types";
import { MODEL_REGISTRY, type ModelKey } from "./models.js";

interface LoadedModel {
  modelId: string;
  modelKey: ModelKey;
  modelType: ModelType;
  label: string;
  loadedAt: number;
}

type ProgressCallback = (percent: number) => void;

let sdkModule: typeof import("@qvac/sdk") | null = null;

async function getSDK() {
  if (!sdkModule) {
    sdkModule = await import("@qvac/sdk");
  }
  return sdkModule;
}

export class ModelManager {
  private static instance: ModelManager;
  private loadedModels = new Map<ModelKey, LoadedModel>();
  private loadingPromises = new Map<ModelKey, Promise<string>>();

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * Load a model by its registry key.
   * Safe to call multiple times — returns cached modelId if already loaded.
   */
  async load(key: ModelKey, onProgress?: ProgressCallback): Promise<string> {
    const existing = this.loadedModels.get(key);
    if (existing) return existing.modelId;

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    const loadPromise = this._doLoad(key, onProgress);
    this.loadingPromises.set(key, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  private async _doLoad(key: ModelKey, onProgress?: ProgressCallback): Promise<string> {
    const sdk = await getSDK();
    const entry = MODEL_REGISTRY[key];

    // Resolve model source: built-in SDK constant or direct URL
    let modelSrc: string;
    if (entry.src in sdk) {
      modelSrc = (sdk as unknown as Record<string, string>)[entry.src];
    } else {
      // Direct URL (HuggingFace HTTPS or pear://)
      modelSrc = entry.src;
    }

    console.log(`[ModelManager] Loading ${entry.label} from ${modelSrc.slice(0, 60)}...`);

    const modelId = await sdk.loadModel({
      modelSrc,
      modelType: entry.type,
      onProgress: (progress: { percentage: number }) => {
        const pct = Math.round(progress.percentage ?? 0);
        onProgress?.(pct);
        if (pct % 10 === 0) {
          console.log(`[ModelManager] ${entry.label}: ${pct}%`);
        }
      },
    });

    this.loadedModels.set(key, {
      modelId,
      modelKey: key,
      modelType: entry.type,
      label: entry.label,
      loadedAt: Date.now(),
    });

    console.log(`[ModelManager] ✅ ${entry.label} ready → ${modelId}`);
    return modelId;
  }

  getModelId(key: ModelKey): string {
    const model = this.loadedModels.get(key);
    if (!model) {
      throw new Error(`Model ${key} is not loaded. Call load() first.`);
    }
    return model.modelId;
  }

  isLoaded(key: ModelKey): boolean {
    return this.loadedModels.has(key);
  }

  isLoading(key: ModelKey): boolean {
    return this.loadingPromises.has(key);
  }

  async unload(key: ModelKey): Promise<void> {
    const model = this.loadedModels.get(key);
    if (!model) return;

    const sdk = await getSDK();
    await sdk.unloadModel({ modelId: model.modelId });
    this.loadedModels.delete(key);
    console.log(`[ModelManager] Unloaded ${model.label}`);
  }

  async unloadAll(): Promise<void> {
    const keys = [...this.loadedModels.keys()];
    await Promise.all(keys.map((k) => this.unload(k)));
  }

  getStatus(): ModelStatus[] {
    return [...this.loadedModels.values()].map((m) => ({
      modelId: m.modelId,
      modelType: m.modelType,
      loaded: true,
    }));
  }

  getLoadedKeys(): ModelKey[] {
    return [...this.loadedModels.keys()];
  }
}

export const modelManager = ModelManager.getInstance();
