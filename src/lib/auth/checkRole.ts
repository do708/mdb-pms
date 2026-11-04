export const USER_ROLES = [
    "admin",
    "office",
    "engineer",
    "magazijn",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
    admin: "Administrator",
    office: "Kantoor",
    engineer: "Monteur",
    magazijn: "Magazijn",
};

export function isUserRole(value: string): value is UserRole {
    return (USER_ROLES as readonly string[]).includes(value);
}







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