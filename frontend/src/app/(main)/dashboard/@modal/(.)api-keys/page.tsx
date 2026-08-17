import { AdminModal } from "@/app/(main)/dashboard/_components/admin-modal";
import ApiKeysPage from "@/app/(main)/dashboard/(admin)/api-keys/page";
import { requireAdminPage } from "@/server/require-admin";

export default async function ApiKeysModalPage(props: {
  searchParams: Promise<{ page?: string; search?: string; sortField?: string; sortOrder?: string }>;
}) {
  await requireAdminPage();

  return (
    <AdminModal activeId="api-keys">
      <ApiKeysPage searchParams={props.searchParams} />
    </AdminModal>
  );
}
