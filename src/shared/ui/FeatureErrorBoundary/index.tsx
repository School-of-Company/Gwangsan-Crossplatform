import * as Sentry from '@sentry/react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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
        return this.props.fallback;
      }
      return (
        <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
          <Text className="text-center text-lg font-semibold text-gray-800">
            오류가 발생했습니다
          </Text>
          <Text className="text-center text-sm text-gray-500">잠시 후 다시 시도해 주세요.</Text>
          <TouchableOpacity className="rounded-xl bg-main-500 px-8 py-3" onPress={this.reset}>
            <Text className="font-semibold text-white">다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
