import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Let op: hier bewust authConfig (zonder Prisma/bcrypt),
// anders crasht de middleware-runtime.
export default NextAuth(authConfig).auth;

export const config = {
    matcher: [
        /*
         * Alles behalve:
         * - _next/static, _next/image
         * - favicon, images, uploads
         * - bestanden met een extensie (.png, .pdf, ...)
         */
        "/((?!_next/static|_next/image|favicon.ico|images|uploads|.*\\..*).*)",
    ],
};
