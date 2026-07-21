import UserMenu from "./UserMenu";


export default function Header() {


    return (

        <header className="h-16 border-b bg-white flex items-center justify-between px-6">


            <div>

                <h2 className="font-semibold text-gray-900">

                    MDB Networks

                </h2>


                <p className="text-xs text-gray-500">

                    Project Management System

                </p>


            </div>


            <UserMenu />


        </header>

    );

}