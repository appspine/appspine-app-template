import { createAuthFixtures, expect } from "@appspine/e2e-kit";

import { testEnv } from "./test-env";

export const test = createAuthFixtures({
  baseURL: testEnv.baseURL,
  admin: testEnv.admin,
  user: testEnv.user,
});

export { expect };
