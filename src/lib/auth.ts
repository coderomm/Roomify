import GoogleProvider from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { emailSchema, passwordSchema } from '@/schema/credentials-schema';
import prisma from './db';
import bcrypt from "bcryptjs";
import { PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { JWT } from 'next-auth/jwt';
import { NextAuthOptions, Session } from 'next-auth';

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { type: "email" },
                password: { type: "password" }
            },
            async authorize(credentials) {
                if (!credentials || !credentials.email || !credentials.password) {
                    throw new Error("Email and password are required");
                }

                const emailValidation = emailSchema.safeParse(credentials.email);
                if (!emailValidation.success) {
                    throw new Error("Invalid email");
                }

                const passwordValidation = passwordSchema.safeParse(credentials.password);
                if (!passwordValidation.success) {
                    throw new Error(passwordValidation.error.issues[0].message);
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: emailValidation.data }
                    })

                    if (!user) {
                        const hashedPassword = await bcrypt.hash(passwordValidation.data, 10);
                        const newUser = await prisma.user.create({
                            data: {
                                email: emailValidation.data,
                                password: hashedPassword,
                                provider: "Credentials",
                            },
                        });
                        return newUser;
                    }

                    if (!user.password) {
                        const hashedPassword = await bcrypt.hash(passwordValidation.data, 10)
                        const updatedUser = await prisma.user.update({
                            where: { email: emailValidation.data },
                            data: { password: hashedPassword },
                        });
                        return updatedUser;
                    }

                    const isPasswordValid = await bcrypt.compare(passwordValidation.data, user.password)
                    if (!isPasswordValid) {
                        throw new Error("Invalid password");
                    }

                    return user;
                } catch (error) {
                    if (error instanceof PrismaClientInitializationError) {
                        throw new Error("Database connection error");
                    }
                    console.error(error);
                    throw error;
                }
            }
        })
    ],
    pages: {
        signIn: "/auth"
    },
    secret: process.env.NEXTAUTH_SECRET || "secret",
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.email = profile.email as string;
                token.id = account.access_token || undefined;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: token.email || "" }
                })
                if (user) {
                    session.user.id = user.id;
                }
            } catch (error) {
                if (error instanceof PrismaClientInitializationError) {
                    throw new Error("Database connection error");
                }
                console.log(error);
                throw error;
            }
            return session;
        },
        async signIn({ account, profile }) {
            if (account?.provider === "google" && profile?.email) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: profile.email }
                    });
                    if (!existingUser) {
                        await prisma.user.create({
                            data: {
                                email: profile.email,
                                name: profile.name || undefined,
                                provider: "Google"
                            },
                        });
                    }
                    return true;
                } catch (error) {
                    console.log(error);
                    return false;
                }
            }
            return true;
        }
    }
} satisfies NextAuthOptions;