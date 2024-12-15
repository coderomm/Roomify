import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { user } = session || {};
        if (!user) {
            return NextResponse.json(
                { message: "Unauthenticated" },
                { status: 403 }
            );
        }
        const data = await req.json();
        const updatedStream = await db.stream.updateMany({
            where: {
                userId: user.id,
                played: false,
                spaceId: data.spaceId
            },
            data: {
                played: true,
                playedTs: new Date(),
            },
        });

        if (updatedStream.count === 0) {
            return NextResponse.json(
                { message: "No unplayed streams found to update." },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Queue emptied successfully" });
    } catch (error) {
        console.error("Error emptying queue:", error);
        return NextResponse.json(
            { message: "Error while emptying the queue" },
            { status: 500 }
        );
    }
}