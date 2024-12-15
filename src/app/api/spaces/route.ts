import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "You must be logged in to create a space" },
                { status: 401 }
            );
        }

        const data = await req.json();
        if (!data.spaceName) {
            return NextResponse.json(
                { success: false, message: "Space name is required" },
                { status: 400 }
            );
        }

        const space = await prisma.space.create({
            data: {
                name: data.spaceName,
                hostId: session.user.id,
            },
        });
        return NextResponse.json(
            { success: true, message: "Space created successfully", space },
            { status: 201 }
        );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
        if (error.message === "Unauthenticated Request") {
            return NextResponse.json(
                { success: false, message: "You must be logged in to create a space" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: false, message: `An unexpected error occurred: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const spaceId = req.nextUrl.searchParams.get("spaceId");
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "You must be logged in to delete a space" },
                { status: 401 }
            );
        }

        if (!spaceId) {
            return NextResponse.json(
                { success: false, message: "Space Id is required" },
                { status: 401 }
            );
        }

        const space = await prisma.space.findUnique({
            where: { id: spaceId },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: "Space not found" },
                { status: 404 }
            );
        }

        if (space.hostId !== session.user.id) {
            return NextResponse.json(
                { success: false, message: "You are not authorized to delete this space" },
                { status: 403 }
            );
        }

        await prisma.space.delete({
            where: { id: spaceId },
        });


        return NextResponse.json(
            { success: true, message: "Space deleted successfully" },
            { status: 200 }
        );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error deleting space:", error);
        return NextResponse.json(
            { success: false, message: `Error deleting space: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "You must be logged in to retrieve space information" },
                { status: 401 }
            );
        }
        const spaceId = req.nextUrl.searchParams.get("spaceId");

        if (spaceId) {
            const space = await prisma.space.findUnique({
                where: { id: spaceId },
                select: { hostId: true },
            });

            if (!space) {
                return NextResponse.json(
                    { success: false, message: "Space not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { success: true, message: "Host ID retrieved successfully", hostId: space.hostId },
                { status: 200 }
            );
        }

        const spaces = await prisma.space.findMany({
            where: {
                hostId: session.user.id
            }
        })
        return NextResponse.json(
            { success: true, message: "Spaces retrieved successfully", spaces },
            { status: 200 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error retrieving space:", error);
        return NextResponse.json(
            { success: false, message: `Error retrieving space: ${error.message}` },
            { status: 500 }
        );
    }
}