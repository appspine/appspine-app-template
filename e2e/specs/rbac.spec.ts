import { registerRbacSpec } from "@appspine/e2e-kit";

import { test } from "../fixtures";
import { testEnv } from "../test-env";

registerRbacSpec({
  test,
  baseURL: testEnv.baseURL,
});
