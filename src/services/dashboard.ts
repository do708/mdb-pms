import { prisma } from "@/lib/prisma";


export async function getDashboardStats() {


    const [
        workorders,
        projects,
        customers,
        users,
    ] = await Promise.all([


        prisma.workorder.count(),


        prisma.project.count(),


        prisma.customer.count(),


        prisma.user.count(),


    ]);



    return {

        workorders,

        projects,

        customers,

        users,

    };

}