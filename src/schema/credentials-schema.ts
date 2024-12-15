import { z } from "zod";

export const emailSchema = z.string({ message: "Email is required" })
    .email({ message: "Invalid email" });

export const passwordSchema = z.string({ message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    });

export const CreateStreamSchema = z.object({
    creatorId: z.string({ message: "creatorId is required" }),
    url: z.string({ message: "url is required" }),
    spaceId: z.string({ message: "spaceId is required" })
});

export const MAX_QUEUE_LEN = 20;