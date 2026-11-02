import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { appVersionHandlers } from './handlers/appVersion';

export const server = setupServer(...authHandlers, ...appVersionHandlers);
