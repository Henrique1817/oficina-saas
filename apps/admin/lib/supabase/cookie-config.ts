/** Cookie storage separado do `apps/web` (mesmo host localhost, portas diferentes). */
export const ADMIN_AUTH_COOKIE_NAME = "oficina-admin-auth";

export const adminCookieOptions = {
  name: ADMIN_AUTH_COOKIE_NAME,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
