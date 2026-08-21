CREATE TABLE "oidc_identities" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "linked_from_legacy_email" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oidc_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oidc_identities_issuer_subject_key" ON "oidc_identities"("issuer", "subject");
CREATE INDEX "oidc_identities_user_id_idx" ON "oidc_identities"("user_id");
