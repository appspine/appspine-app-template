DROP INDEX IF EXISTS "notifications_recipient_user_id_read_at_archived_at_created_at_idx";
CREATE INDEX "notifications_recipient_user_id_archived_at_read_at_created_at_idx"
  ON "notifications"("recipient_user_id", "archived_at", "read_at", "created_at");
