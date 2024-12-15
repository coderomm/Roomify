import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
    streamId: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthenticated" }, { status: 403 });
        }

        const user = session.user;
        const data = UpvoteSchema.parse(await req.json());

        await db.upvote.delete({
            where: {
                userId_streamId: {
                    userId: user.id,
                    streamId: data.streamId,
                },
            },
        });

        return NextResponse.json({ message: "Done!" });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid data format" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error while upvoting" }, { status: 500 });
    }
}