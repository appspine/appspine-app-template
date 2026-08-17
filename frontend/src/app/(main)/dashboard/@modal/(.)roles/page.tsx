import { AdminModal } from "@/app/(main)/dashboard/_components/admin-modal";
import RolesPage from "@/app/(main)/dashboard/(admin)/roles/page";
import { requireAdminPage } from "@/server/require-admin";

export default async function RolesModalPage(props: {
  searchParams: Promise<{ page?: string; search?: string; sortField?: string; sortOrder?: string }>;
}) {
  await requireAdminPage();

  return (
    <AdminModal activeId="roles">
      <RolesPage searchParams={props.searchParams} />
    </AdminModal>
  );
}
