import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RemoveStreamSchema = z.object({
    streamId: z.string(),
    spaceId: z.string()
});

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
        return NextResponse.json(
            { message: "Unauthenticated" },
            { status: 403 },
        );
    }
    const user = session.user;

    try {
        const { searchParams } = new URL(req.url);
        const streamId = searchParams.get("streamId");
        const spaceId = searchParams.get('spaceId')

        const validationResult = RemoveStreamSchema.safeParse({ streamId, spaceId });
        if (!validationResult.success) {
            return NextResponse.json(
                { message: "Invalid parameters" },
                { status: 400 }
            );
        }

        if (!streamId || !spaceId) {
            return NextResponse.json(
                { message: "Stream ID and Space ID are required" },
                { status: 400 }
            );
        }

        const deletedStream = await db.stream.delete({
            where: {
                id: streamId,
                userId: user.id,
                spaceId: spaceId,
            },
        });

        if (!deletedStream) {
            return NextResponse.json(
                { message: "Stream not found or you do not have permission to delete it" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Song removed successfully",
        });
    } catch (e) {
        console.error("Error removing song:", e);
        return NextResponse.json(
            { message: "Error while removing the song" },
            { status: 500 }
        );
    }
}