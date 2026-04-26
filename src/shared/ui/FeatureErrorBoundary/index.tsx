import * as Sentry from '@sentry/react-native';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import React from 'react';
import { ErrorFallback } from '../ErrorFallback';

type FallbackRender = (props: { reset: () => void }) => React.ReactNode;

interface FeatureErrorBoundaryProps {
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode | FallbackRender;
}

interface InnerProps extends FeatureErrorBoundaryProps {
  onReset: () => void;
}

interface InnerState {
  hasError: boolean;
}

class FeatureErrorBoundaryInner extends React.Component<InnerProps, InnerState> {
  state: InnerState = { hasError: false };

  static getDerivedStateFromError(): InnerState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const { featureName } = this.props;
    Sentry.addBreadcrumb({
      category: 'ui.error',
      message: `Render error in ${featureName}`,
      level: 'error',
    });
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
      tags: { feature: featureName },
    });
  }

  reset = () => {
    this.props.onReset();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({ reset: this.reset });
        }
        return this.props.fallback;
      }
      return <ErrorFallback onRetry={this.reset} />;
    }

    return this.props.children;
  }
}

export function FeatureErrorBoundary({
  children,
  featureName,
  fallback,
}: FeatureErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <FeatureErrorBoundaryInner onReset={reset} featureName={featureName} fallback={fallback}>
          {children}
        </FeatureErrorBoundaryInner>
      )}
    </QueryErrorResetBoundary>
  );
}
