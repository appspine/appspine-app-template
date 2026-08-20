"use client";

// Keep the client-component boundary inside the app. Importing this named client
// export directly from the shared CommonJS barrel makes Next's RSC proxy expose
// it as undefined during server rendering.
export { LoginButton } from "@appspine/oidc-auth/frontend";
