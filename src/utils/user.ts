import { UserWithoutPassword } from '../models/user.model';

export interface PublicUser {
  id: number;
  email: string;
  name: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toPublicUser = (user: UserWithoutPassword): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  displayName: user.name,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});
