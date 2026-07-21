import Sidebar from "./Sidebar";
import Header from "./Header";


export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {


    return (

        <div className="flex min-h-screen bg-gray-50">


            <Sidebar />


            <div className="flex-1">


                <Header />


                <main className="p-6">

                    {children}

                </main>


            </div>


        </div>

    );

}