import { prisma } from "@/lib/prisma";


export async function getDashboardStats() {

    const [
        users,
        customers,
        projects,
        workorders,
    ] = await Promise.all([

        prisma.user.count(),

        prisma.customer.count(),

        prisma.project.count(),

        prisma.workorder.count(),

    ]);


    return {
        users,
        customers,
        projects,
        workorders,
    };

}



export async function getWorkorderStatus() {


    const result = await prisma.workorder.groupBy({

        by: ["status"],

        _count: {

            status: true,

        },

    });



    return result.map((item) => ({

        status: item.status,

        count: item._count.status,

    }));

}