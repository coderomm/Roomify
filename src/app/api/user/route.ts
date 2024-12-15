import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server";

export const GET = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json(
            {
                Message: "Unauthenticated"
            },
            {
                status: 403
            }
        )
    }
}