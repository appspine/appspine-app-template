import { registerAuthSpec } from "@appspine/e2e-kit";

import { testEnv } from "../test-env";

registerAuthSpec({
  baseURL: testEnv.baseURL,
  apiURL: testEnv.apiURL,
  authCookieName: testEnv.authCookieName,
});
