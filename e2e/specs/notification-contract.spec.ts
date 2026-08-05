import { expect, test } from "../fixtures";
import { testEnv } from "../test-env";

async function token(username: string, password: string) {
  const response = await fetch(`${testEnv.keycloak.issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: testEnv.keycloak.clientId,
      client_secret: testEnv.keycloak.clientSecret,
      username,
      password,
      scope: "openid",
    }),
  });
  expect(response.ok).toBe(true);
  const body = (await response.json()) as { access_token: string };
  return { Authorization: `Bearer ${body.access_token}` };
}

// Coverage note for forkers: this template ships the notification inbox as plumbing only — there is
// no producer, so no notification can be created through its own API surface at all. That leaves
// exactly two contracts testable here: the guaranteed-empty inbox and the guaranteed-404 for an
// unknown id. Once you add a producer, extend this file with the happy path and a real cross-user
// ownership test (seed a notification for user A, mutate it as user B, expect 404) — see
// `apps/project`'s version of this spec for that shape.

test("notification inbox endpoints preserve the empty-state contract", async ({ adminPage, userPage }) => {
  // Ensure the regular user's local row is JIT-provisioned before exercising the
  // bearer-token API contract directly.
  await userPage.goto("/dashboard");
  const admin = await token(testEnv.admin.username, testEnv.admin.password);
  const user = await token(testEnv.user.username, testEnv.user.password);

  const adminCount = await adminPage.request.get(`${testEnv.apiURL}/notifications/unread-count`, { headers: admin });
  expect(adminCount.ok()).toBe(true);
  expect((await adminCount.json()).count).toBe(0);

  const userList = await adminPage.request.get(`${testEnv.apiURL}/notifications?limit=10`, { headers: user });
  expect(userList.ok()).toBe(true);
  expect((await userList.json()).data).toEqual([]);

  const markAll = await adminPage.request.post(`${testEnv.apiURL}/notifications/mark-all-read`, { headers: user });
  expect(markAll.ok()).toBe(true);
  expect((await markAll.json()).count).toBe(0);
});

test("mutating a nonexistent notification id answers 404, never 403", async ({ adminPage, userPage }) => {
  // The recipient-scoped lookup in @appspine/notification raises NotFound rather than Forbidden on
  // purpose: a 403 would confirm to the caller that the id exists and belongs to someone else. This
  // pins the status the frontend and any API consumer sees — 401, 403 and 500 all count as
  // regressions.
  //
  // Honest scope: this proves "unknown id → 404" only. It does NOT prove cross-user ownership,
  // because this template has no way to create a notification for another user over HTTP (no
  // producer is scaffolded). The empty-inbox assertion below is what makes the id below one the
  // caller provably does not own — but it is unowned by *everyone*, not owned by someone else.
  await userPage.goto("/dashboard");
  const user = await token(testEnv.user.username, testEnv.user.password);

  const ownList = await adminPage.request.get(`${testEnv.apiURL}/notifications?limit=10`, { headers: user });
  expect(ownList.ok()).toBe(true);
  expect((await ownList.json()).data).toEqual([]);

  const unknownId = "cm000000000000000000000000";

  const markRead = await adminPage.request.post(`${testEnv.apiURL}/notifications/${unknownId}/read`, {
    headers: user,
  });
  expect(markRead.status()).toBe(404);

  const archive = await adminPage.request.post(`${testEnv.apiURL}/notifications/${unknownId}/archive`, {
    headers: user,
  });
  expect(archive.status()).toBe(404);
});
