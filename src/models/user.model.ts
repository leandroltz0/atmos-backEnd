export interface User {
  id: number;
  email: string;
  password: string;
  created_at: Date;
}

export interface UserWithoutPassword {
  id: number;
  email: string;
  created_at: Date;
}

export interface AuthPayload {
  email: string;
  password: string;
}
