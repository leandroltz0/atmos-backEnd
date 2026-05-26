export interface User {
  id: number;
  name: string | null;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword {
  id: number;
  name: string | null;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthPayload {
  email: string;
  password: string;
}
