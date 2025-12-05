import { useReducer, useRef, useCallback, useEffect } from "react";

export interface CaptureState {
  isCapturing: boolean;
  isProcessing: boolean;
}

type CaptureAction =
  | { type: "CAPTURE_START" }
  | { type: "CAPTURE_SUCCESS" }
  | { type: "CAPTURE_FAILED" }
  | { type: "PROCESSING_COMPLETE" }
  | { type: "ABORT" }
  | { type: "RESET" };

const initialState: CaptureState = {
  isCapturing: false,
  isProcessing: false,
};

function captureReducer(state: CaptureState, action: CaptureAction): CaptureState {
  switch (action.type) {
    case "CAPTURE_START":
      return { isCapturing: true, isProcessing: false };
    case "CAPTURE_SUCCESS":
      return { isCapturing: false, isProcessing: true };
    case "CAPTURE_FAILED":
      return { isCapturing: false, isProcessing: false };
    case "PROCESSING_COMPLETE":
      return { isCapturing: false, isProcessing: false };
    case "ABORT":
      return { isCapturing: false, isProcessing: false };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export interface UseCaptureControllerReturn {
  state: CaptureState;
  isCapturing: boolean;
  isProcessing: boolean;
  abortRef: React.MutableRefObject<AbortController | null>;
  startCapture: () => void;
  captureSuccess: () => void;
  captureFailed: () => void;
  processingComplete: () => void;
  abort: () => void;
  reset: () => void;
  getAbortSignal: () => AbortSignal;
}

export function useCaptureController(): UseCaptureControllerReturn {
  const [state, dispatch] = useReducer(captureReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const getAbortSignal = useCallback((): AbortSignal => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  }, []);

  const startCapture = useCallback(() => {
    dispatch({ type: "CAPTURE_START" });
  }, []);

  const captureSuccess = useCallback(() => {
    dispatch({ type: "CAPTURE_SUCCESS" });
  }, []);

  const captureFailed = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "CAPTURE_FAILED" });
  }, []);

  const processingComplete = useCallback(() => {
    abortRef.current = null;
    dispatch({ type: "PROCESSING_COMPLETE" });
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "ABORT" });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    state,
    isCapturing: state.isCapturing,
    isProcessing: state.isProcessing,
    abortRef,
    startCapture,
    captureSuccess,
    captureFailed,
    processingComplete,
    abort,
    reset,
    getAbortSignal,
  };
}
