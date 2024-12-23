import { createContext } from 'react';
import { User } from "../types/User";


export const UserContext = createContext<User>({
    id:"",
    email:"",
    role:null
});

export default UserContext;