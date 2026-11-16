import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { appVersionHandlers } from './handlers/appVersion';
import { postHandlers } from './handlers/post';

export const server = setupServer(...authHandlers, ...appVersionHandlers, ...postHandlers);
