import { createAppspineModule } from "@appspine/plugin-host-nest";
import { Module } from "@nestjs/common";

import { appspineConfig } from "./appspine.config";

const composedAppspineModule = createAppspineModule(appspineConfig);

/**
 * Shares one non-global plugin composition with feature modules that explicitly import the
 * platform capabilities they consume.
 */
@Module({
  imports: [composedAppspineModule],
  exports: [composedAppspineModule],
})
export class AppspinePlatformModule {}
