import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthenticated" },
                { status: 403 }
            );
        }

        const user = session.user;
        const spaceId = req.nextUrl.searchParams.get("spaceId");

        const mostUpvotedStream = await db.stream.findFirst({
            where: {
                userId: user.id,
                played: false,
                spaceId: spaceId
            },
            orderBy: {
                upvotes: {
                    _count: "desc",
                },
            },
        });

        if (!mostUpvotedStream) {
            return NextResponse.json(
                { message: "No upvoted stream found" },
                { status: 404 }
            );
        }

        await Promise.all([
            db.currentStream.upsert({
                where: {
                    spaceId: spaceId as string
                },
                update: {
                    userId: user.id,
                    streamId: mostUpvotedStream?.id,
                    spaceId: spaceId
                },
                create: {
                    userId: user.id,
                    streamId: mostUpvotedStream?.id,
                    spaceId: spaceId
                },
            }),
            db.stream.update({
                where: {
                    id: mostUpvotedStream?.id ?? "",
                },
                data: {
                    played: true,
                    playedTs: new Date(),
                },
            }),
        ]);

        return NextResponse.json({
            stream: mostUpvotedStream,
        });
    } catch (error) {
        console.error("Error handling stream:", error);
        return NextResponse.json(
            { message: "Error while processing the stream" },
            { status: 500 }
        );
    }
}