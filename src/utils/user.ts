import { UserWithoutPassword } from '../models/user.model';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Representación pública del usuario (sin datos sensibles, con camelCase). */
export interface PublicUser {
  id: number;
  email: string;
  name: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convierte un usuario de la base de datos (snake_case) a formato público (camelCase). */
export const toPublicUser = (user: UserWithoutPassword): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  displayName: user.name,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});
