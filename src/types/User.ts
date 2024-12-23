export type UserRole = 'Admin' | 'Agent' | 'Client'; // Extend as needed

export interface User {
  id: string;
  email: string;
  role: UserRole | null;
}

export interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}