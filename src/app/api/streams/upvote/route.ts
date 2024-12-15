import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
    streamId: z.string(),
    spaceId: z.string()
});

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json(
            { message: "Unauthenticated" },
            { status: 403 }
        );
    }
    const user = session.user;

    try {
        const data = UpvoteSchema.parse(await req.json());

        const existingUpvote = await db.upvote.findUnique({
            where: {
                userId_streamId: {
                    userId: user.id,
                    streamId: data.streamId,
                },
            },
        });
        if (existingUpvote) {
            return NextResponse.json(
                { message: "You have already upvoted this stream" },
                { status: 400 }
            );
        }

        await db.upvote.create({
            data: {
                userId: user.id,
                streamId: data.streamId,
            },
        });
        return NextResponse.json({
            message: "Upvoted successfully!",
        });
    } catch (e) {
        console.error("Error while upvoting:", e);
        return NextResponse.json(
            { message: "Error while upvoting" },
            { status: 500 }
        );
    }
}