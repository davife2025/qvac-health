/**
 * ModelManager — singleton that owns the QVAC model lifecycle.
 *
 * Responsibilities:
 *   - Load models on first use, reuse across requests
 *   - Track load progress for UI feedback
 *   - Graceful unload on shutdown
 *   - Never let two loads of the same model race
 */

import type { ModelStatus, ModelType } from "@qvac-health/types";

interface LoadedModel {
  modelId: string;
  modelType: ModelType;
  loadedAt: number;
}

type ProgressCallback = (progress: number) => void;

// Lazy-loaded so the module can be imported in non-SDK environments (tests, web)
let sdkModule: typeof import("@qvac/sdk") | null = null;

async function getSDK() {
  if (!sdkModule) {
    sdkModule = await import("@qvac/sdk");
  }
  return sdkModule;
}

export class ModelManager {
  private static instance: ModelManager;
  private loadedModels = new Map<string, LoadedModel>();
  private loadingPromises = new Map<string, Promise<string>>();

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * Load a model by its SDK constant name.
   * Safe to call multiple times — returns cached modelId if already loaded.
   */
  async load(
    modelConstantName: string,
    modelType: ModelType,
    onProgress?: ProgressCallback
  ): Promise<string> {
    // Return existing model if loaded
    const existing = this.findByConstant(modelConstantName);
    if (existing) return existing.modelId;

    // Deduplicate concurrent load requests
    if (this.loadingPromises.has(modelConstantName)) {
      return this.loadingPromises.get(modelConstantName)!;
    }

    const loadPromise = this._doLoad(modelConstantName, modelType, onProgress);
    this.loadingPromises.set(modelConstantName, loadPromise);

    try {
      const modelId = await loadPromise;
      return modelId;
    } finally {
      this.loadingPromises.delete(modelConstantName);
    }
  }

  private async _doLoad(
    modelConstantName: string,
    modelType: ModelType,
    onProgress?: ProgressCallback
  ): Promise<string> {
    const sdk = await getSDK();

    // Resolve the model source from the SDK constant
    const modelSrc = (sdk as Record<string, unknown>)[modelConstantName] as string;
    if (!modelSrc) {
      throw new Error(
        `Unknown model constant: ${modelConstantName}. Check @qvac/sdk exports.`
      );
    }

    const modelId = await sdk.loadModel({
      modelSrc,
      modelType,
      onProgress: (progress: number) => {
        onProgress?.(Math.round(progress * 100));
      },
    });

    this.loadedModels.set(modelConstantName, {
      modelId,
      modelType,
      loadedAt: Date.now(),
    });

    console.log(`[ModelManager] Loaded ${modelConstantName} → modelId: ${modelId}`);
    return modelId;
  }

  /**
   * Get a loaded model's ID. Throws if not loaded.
   */
  getModelId(modelConstantName: string): string {
    const model = this.findByConstant(modelConstantName);
    if (!model) {
      throw new Error(
        `Model ${modelConstantName} is not loaded. Call load() first.`
      );
    }
    return model.modelId;
  }

  /**
   * Unload a single model and free memory.
   */
  async unload(modelConstantName: string): Promise<void> {
    const model = this.findByConstant(modelConstantName);
    if (!model) return;

    const sdk = await getSDK();
    await sdk.unloadModel({ modelId: model.modelId });
    this.loadedModels.delete(modelConstantName);
    console.log(`[ModelManager] Unloaded ${modelConstantName}`);
  }

  /**
   * Unload all models. Call on process shutdown.
   */
  async unloadAll(): Promise<void> {
    const keys = [...this.loadedModels.keys()];
    await Promise.all(keys.map((k) => this.unload(k)));
  }

  getStatus(): ModelStatus[] {
    return [...this.loadedModels.entries()].map(([, m]) => ({
      modelId: m.modelId,
      modelType: m.modelType,
      loaded: true,
    }));
  }

  isLoaded(modelConstantName: string): boolean {
    return this.loadedModels.has(modelConstantName);
  }

  private findByConstant(name: string): LoadedModel | undefined {
    return this.loadedModels.get(name);
  }
}

export const modelManager = ModelManager.getInstance();
