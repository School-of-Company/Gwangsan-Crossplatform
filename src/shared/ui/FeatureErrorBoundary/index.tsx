import * as Sentry from '@sentry/react-native';
import React from 'react';
import { ErrorFallback } from '../ErrorFallback';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((props: { reset: () => void }) => React.ReactNode);
}

interface State {
  hasError: boolean;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  private getScreenName(): string {
    if (!React.isValidElement(this.props.children)) return 'unknown';
    const { type } = this.props.children;
    if (typeof type !== 'function') return 'unknown';
    const component = type as React.ComponentType;
    return component.displayName ?? component.name ?? 'unknown';
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const screenName = this.getScreenName();
    Sentry.addBreadcrumb({
      category: 'ui.error',
      message: `Render error in ${screenName}`,
      level: 'error',
    });
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
      tags: { screen: screenName },
    });
  }

  reset = () => {
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
