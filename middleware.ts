import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(r: NextRequest) {
    const token = await getToken({ req: r, secret: process.env.NEXTAUTH_SECRET });
    const isAuth = token ? true : false;
    const pathNames = r.nextUrl.pathname.split('/');

    if (!isAuth && (pathNames[1] == 'home' || pathNames[1] == 'dashboard' || pathNames[1] == 'spaces')) {
        const loginPath = `/auth`;
        const loginURL = new URL(loginPath, r.nextUrl.origin);
        return NextResponse.redirect(loginURL.toString());
    }
    if ((isAuth && pathNames[1] == "auth")) {
        const newURL = new URL("/home", r.nextUrl.origin);
        return NextResponse.redirect(newURL.toString());
    }
    return NextResponse.next();
}