import { createPlaywrightConfig } from "@appspine/e2e-kit";

import { testEnv } from "./test-env";

export default createPlaywrightConfig({
  baseURL: testEnv.baseURL,
  apiURL: testEnv.apiURL,
  testDir: "./specs",
  outputDir: "./test-results",
});
