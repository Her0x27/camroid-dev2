import { Component, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { logger } from "@/lib/logger";

const isSentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN) && import.meta.env.PROD;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    logger.error("Error caught by ErrorBoundary", { error, errorInfo });
    
    if (isSentryEnabled) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
    
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.props.onReset?.();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetKey: prev.resetKey + 1,
    }));
  };

  handleResetForNavigation = (): void => {
    this.props.onReset?.();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetKey: prev.resetKey + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryContent
          error={this.state.error}
          onRetry={this.handleRetry}
          onResetForNavigation={this.handleResetForNavigation}
        />
      );
    }

    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

interface ErrorBoundaryContentProps {
  error: Error | null;
  onRetry: () => void;
  onResetForNavigation: () => void;
}

function ErrorBoundaryContent({ error, onRetry, onResetForNavigation }: ErrorBoundaryContentProps) {
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{t.components.error.somethingWentWrong}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t.components.error.unexpectedError}
          </p>
          
          {import.meta.env.DEV && error && (
            <div className="p-3 bg-muted rounded-md overflow-auto max-h-32">
              <p className="text-xs font-mono text-destructive">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              asChild
              data-testid="button-error-home"
            >
              <Link href="/" onClick={onResetForNavigation}>
                <Home className="w-4 h-4 mr-2" />
                {t.components.error.home}
              </Link>
            </Button>
            <Button
              className="flex-1"
              onClick={onRetry}
              data-testid="button-error-retry"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.components.error.tryAgain}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AsyncErrorBoundary({ children, fallback }: AsyncBoundaryProps): ReactNode {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        logger.error("Async error", error);
        logger.error("Component stack", errorInfo.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
