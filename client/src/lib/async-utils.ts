type SetLoading = (loading: boolean) => void;
type SetError = (error: Error | null) => void;

export interface AsyncResult<T = void> {
  success: boolean;
  data?: T;
  error?: Error;
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  setLoading?: SetLoading,
  setError?: SetError,
  errorMessage: string = "Operation failed"
): Promise<AsyncResult<T>> {
  setLoading?.(true);
  setError?.(null);

  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(errorMessage);
    setError?.(error);
    return { success: false, error };
  } finally {
    setLoading?.(false);
  }
}

export async function withErrorHandlingNoState<T>(
  fn: () => Promise<T>,
  errorMessage: string = "Operation failed"
): Promise<AsyncResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(errorMessage);
    return { success: false, error };
  }
}

export function createAsyncHandler<T>(
  setLoading: SetLoading,
  setError: SetError
) {
  return async (
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<AsyncResult<T>> => {
    return withErrorHandling(fn, setLoading, setError, errorMessage);
  };
}
