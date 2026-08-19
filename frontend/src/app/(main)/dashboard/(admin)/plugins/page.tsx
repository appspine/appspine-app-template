import type { PluginCatalogSummary } from "@appspine/frontend-shell";
import { PluginCatalogTable } from "@appspine/frontend-shell";

import { apiFetch } from "@/server/api-client";

export default async function PluginsAdminPage() {
  const catalog = await apiFetch<PluginCatalogSummary>("/admin/plugins");

  return (
    <div className="flex flex-col gap-4">
      <PluginCatalogTable catalog={catalog} />
    </div>
  );
}
