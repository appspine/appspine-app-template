import { registerM2mApiKeySpec } from "@appspine/e2e-kit";

import { test } from "../fixtures";
import { testEnv } from "../test-env";

registerM2mApiKeySpec({
  test,
  baseURL: testEnv.baseURL,
  apiURL: testEnv.apiURL,
  roleOptionName: testEnv.adminRoleOptionName,
});
