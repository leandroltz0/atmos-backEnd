/** Fila completa de la tabla `users` en la base de datos (incluye contraseña). */
export interface User {
  id: number;
  name: string | null;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

/** Usuario sin la contraseña, para retornar de queries SELECT sin datos sensibles. */
export interface UserWithoutPassword {
  id: number;
  name: string | null;
  email: string;
  created_at: Date;
  updated_at: Date;
}

/** Payload de autenticación (login/register). */
export interface AuthPayload {
  email: string;
  password: string;
}
