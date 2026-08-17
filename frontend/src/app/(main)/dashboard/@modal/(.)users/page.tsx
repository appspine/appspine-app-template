import { AdminModal } from "@/app/(main)/dashboard/_components/admin-modal";
import UsersPage from "@/app/(main)/dashboard/(admin)/users/page";
import { requireAdminPage } from "@/server/require-admin";

export default async function UsersModalPage(props: {
  searchParams: Promise<{ page?: string; search?: string; sortField?: string; sortOrder?: string }>;
}) {
  await requireAdminPage();

  return (
    <AdminModal activeId="users">
      <UsersPage searchParams={props.searchParams} />
    </AdminModal>
  );
}
