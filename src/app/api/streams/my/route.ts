import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const { user } = session || {};
        if (!user) {
            return NextResponse.json(
                { message: "Unauthenticated" },
                { status: 403 }
            );
        }

        const streams = await db.stream.findMany({
            where: {
                userId: user.id,
            },
            include: {
                _count: {
                    select: {
                        upvotes: true,
                    },
                },
                upvotes: {
                    where: {
                        userId: user.id,
                    },
                },
            },
        });

        return NextResponse.json({
            streams: streams.map(({ _count, ...rest }) => ({
                ...rest,
                upvotes: _count.upvotes,
                haveUpvoted: rest.upvotes.length ? true : false,
            })),
        });
    } catch (error) {
        console.error("Error fetching streams:", error);
        return NextResponse.json(
            { message: "Error while fetching streams" },
            { status: 500 }
        );
    }
}