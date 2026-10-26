import { authHandlers } from './handlers/auth.handler';
import { packageHandlers } from './handlers/packages.handler';
import { landingHandlers } from './handlers/landing.handler';

export const handlers = [
  ...authHandlers,
  ...packageHandlers,
  ...landingHandlers,
];
