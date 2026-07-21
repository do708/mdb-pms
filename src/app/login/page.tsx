"use client";

import {
    signIn
} from "next-auth/react";

import {
    useState
} from "react";


export default function LoginPage() {


    const [email,setEmail] =
        useState("");

    const [password,setPassword] =
        useState("");


    async function login() {

        await signIn(
            "credentials",
            {
                email,
                password,
                redirect: true,
                callbackUrl: "/dashboard",
            }
        );

    }


    return (

        <main>

            <h1>
                MDB PMS Login
            </h1>


            <input
                placeholder="Email"
                value={email}
                onChange={
                    e => setEmail(e.target.value)
                }
            />


            <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={
                    e => setPassword(e.target.value)
                }
            />


            <button
                onClick={login}
            >
                Inloggen
            </button>


        </main>

    );

}