import type { ReactNode } from 'react';
import * as Sentry from '@sentry/react-native';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorFallback } from '../ErrorFallback';

interface RootErrorBoundaryProps {
  children: ReactNode;
}

// 앱 전체를 감싸는 마지막 에러 바운더리. 흰 화면 대신 다시 시도할 수 있는 화면을 보여준다.
// 다시 시도하면 에러가 난 쿼리도 함께 초기화해, 같은 에러로 곧바로 다시 던지지 않게 한다.
export function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <Sentry.ErrorBoundary
          onReset={reset}
          fallback={({ resetError }) => <ErrorFallback onRetry={resetError} />}>
          {children}
        </Sentry.ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
