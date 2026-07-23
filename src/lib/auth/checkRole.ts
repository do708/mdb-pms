export type UserRole =

    | "admin"

    | "office"

    | "engineer";







export function checkRole(

    userRole: string,

    allowedRoles: UserRole[]

){


    return allowedRoles.includes(

        userRole as UserRole

    );


}







export function canAccessAdmin(

    role:string

){

    return checkRole(

        role,

        [

            "admin"

        ]

    );

}








export function canAccessOffice(

    role:string

){

    return checkRole(

        role,

        [

            "admin",

            "office"

        ]

    );

}








export function canAccessEngineer(

    role:string

){

    return checkRole(

        role,

        [

            "admin",

            "engineer"

        ]

    );

}