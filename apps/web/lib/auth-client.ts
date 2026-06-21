'use client';

import { createAuthClient } from 'better-auth/react';

/** No baseURL — Better Auth uses window.location.origin in the browser (fixes Railway prod). */
export const authClient = createAuthClient({});
