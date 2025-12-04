import { logger } from "./logger";

export interface WorkerEnhancementOptions {
  sharpness: number;
  denoise: number;
  contrast: number;
}

interface WorkerMessage {
  type: string;
  id: string;
  payload?: ImageData;
  error?: string;
}

type PendingRequest = {
  resolve: (data: ImageData) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let pendingRequests: Map<string, PendingRequest> = new Map();
let requestId = 0;
let workerInitialized = false;
let workerFailed = false;

function generateId(): string {
  return `req_${++requestId}_${Date.now()}`;
}

function initWorker(): boolean {
  if (workerFailed) return false;
  if (worker) return true;
  
  try {
    worker = new Worker("/image-worker.js");
    
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, id, payload, error } = e.data;
      const pending = pendingRequests.get(id);
      
      if (!pending) return;
      
      pendingRequests.delete(id);
      
      if (type === "ENHANCE_RESULT" && payload) {
        pending.resolve(payload);
      } else if (type === "ENHANCE_ERROR") {
        pending.reject(new Error(error || "Worker processing failed"));
      }
    };
    
    worker.onerror = (e) => {
      logger.error("Image worker error", e);
      workerFailed = true;
      pendingRequests.forEach((pending) => {
        pending.reject(new Error("Worker error"));
      });
      pendingRequests.clear();
      terminateWorker();
    };
    
    workerInitialized = true;
    logger.info("Image worker initialized for production");
    return true;
  } catch (error) {
    logger.warn("Failed to initialize image worker, falling back to main thread", error);
    workerFailed = true;
    return false;
  }
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    workerInitialized = false;
  }
}

export function isWorkerAvailable(): boolean {
  if (import.meta.env.DEV) {
    return false;
  }
  
  if (workerFailed) {
    return false;
  }
  
  if (!workerInitialized) {
    return initWorker();
  }
  
  return worker !== null;
}

export async function enhanceImageWithWorker(
  imageData: ImageData,
  options: WorkerEnhancementOptions
): Promise<ImageData> {
  if (!isWorkerAvailable() || !worker) {
    throw new Error("Worker not available");
  }
  
  const id = generateId();
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error("Worker timeout"));
      }
    }, 30000);
    
    const wrappedResolve = (data: ImageData) => {
      clearTimeout(timeout);
      resolve(data);
    };
    
    const wrappedReject = (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    };
    
    pendingRequests.set(id, { resolve: wrappedResolve, reject: wrappedReject });
    
    worker!.postMessage({
      type: "ENHANCE_IMAGE",
      id,
      payload: { imageData, options },
    });
  });
}
