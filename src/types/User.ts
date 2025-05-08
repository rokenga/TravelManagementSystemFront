export type UserRole = 'Admin' | 'Agent'; // Extend as needed

export interface User {
  id: string
  email: string
  role: UserRole | null
  firstName: string
  lastName: string
  birthday: string 
}

export interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}