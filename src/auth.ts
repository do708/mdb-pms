import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";



const adapter = new PrismaPg({

    connectionString:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/mdb_pms",

});



const prisma = new PrismaClient({

    adapter,

});




export const {

    handlers,

    auth,

    signIn,

    signOut,

} = NextAuth({



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



                if (

                    !credentials?.email ||

                    !credentials?.password

                ) {

                    return null;

                }



                const email = String(
                    credentials.email
                );


                const password = String(
                    credentials.password
                );




                const user = await prisma.user.findUnique({


                    where: {

                        email,

                    },


                });





                if (!user) {

                    return null;

                }




const passwordValid = await bcrypt.compare(
    password,
    String(user.password)
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





    pages: {


        signIn: "/login",


    },






    session: {


        strategy: "jwt",


    },






    callbacks: {



        async jwt({


            token,


            user,


        }) {



            if (user) {


                token.id = user.id;

                token.role = user.role;


            }



            return token;



        },







        async session({


            session,


            token,


        }) {



            if (session.user) {


                session.user.id =
                    token.id as string;


                session.user.role =
                    token.role as string;



            }



            return session;



        },



    },



});