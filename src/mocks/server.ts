import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';

export const server = setupServer(...authHandlers);
