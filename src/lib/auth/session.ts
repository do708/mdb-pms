export interface SessionUser {


    id:string;

    name:string | null;

    email:string;

    role:string;


}







let currentUser: SessionUser | null = null;








export function setSession(

    user:SessionUser

){


    currentUser = user;


}








export function getSession(){

    return currentUser;

}








export function getCurrentUser(){

    return currentUser;

}








export function clearSession(){


    currentUser = null;


}