import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";


const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});


const prisma = new PrismaClient({
    adapter,
});


export const { handlers, signIn, signOut, auth } = NextAuth({

    providers: [

        Credentials({

            name: "Credentials",

            credentials: {

                email: {
                    label: "Email",
                    type: "email",
                },

                password: {
                    label: "Password",
                    type: "password",
                },

            },


            async authorize(credentials) {


                if (!credentials?.email || !credentials?.password) {

                    return null;

                }


                const email = credentials.email.toString();

                const password = credentials.password.toString();



                const user = await prisma.user.findUnique({

                    where: {
                        email,
                    },

                });



                if (!user) {

                    return null;

                }



                if (!user.active) {

                    return null;

                }



                const passwordValid = await bcrypt.compare(

                    password,

                    user.password

                );



                if (!passwordValid) {

                    return null;

                }



                return {

                    id: user.id,

                    name: user.name,

                    email: user.email,

                    role: user.role,

                };


            },

        }),

    ],



    session: {

        strategy: "jwt",

    },



    callbacks: {


        async jwt({ token, user }) {


            if (user) {

                token.id = user.id;

                token.role = user.role;

            }


            return token;

        },



        async session({ session, token }) {


            if (session.user) {


                session.user.id = token.id as string;

                session.user.role = token.role as string;


            }


            return session;

        },


    },


    pages: {

        signIn: "/login",

    },


    secret: process.env.AUTH_SECRET,


});