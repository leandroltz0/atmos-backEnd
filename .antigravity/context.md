# Atmos — Backend Context

## Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL
- **Query layer**: `pg` (node-postgres) — SQL directo, sin ORM
- **Auth**: JWT (jsonwebtoken) + bcrypt para hashing de contraseñas

## Decisiones arquitectónicas

- **Sin Prisma ni ningún ORM** — todas las queries se escriben en SQL puro para tener control total sobre la base de datos y fomentar el aprendizaje de SQL.
- **Sin NestJS** — arquitectura simple y directa con Express para mantener el proyecto liviano y comprensible.
- **PostgreSQL** como única base de datos — relacional, robusta, ideal para escalar.

## Estructura de carpetas

```
backEnd/
├── src/
│   ├── config/
│   │   └── db.ts              ← pg Pool, conexión a PostgreSQL
│   ├── models/
│   │   └── user.model.ts      ← interfaces y tipos TypeScript
│   ├── routes/
│   │   └── auth.routes.ts     ← definición de rutas
│   ├── controllers/
│   │   └── auth.controller.ts ← manejo de request/response
│   ├── services/
│   │   └── auth.service.ts    ← lógica de negocio + queries SQL
│   ├── middlewares/
│   │   └── auth.middleware.ts ← validación de JWT
│   └── index.ts               ← entry point, setup de Express
├── .env                       ← variables de entorno (no commitear)
├── package.json
└── tsconfig.json
```

## Responsabilidades por capa

| Capa           | Responsabilidad                                                         |
| -------------- | ----------------------------------------------------------------------- |
| `config/`      | Configuración de la conexión a la base de datos                         |
| `models/`      | Definición de interfaces y tipos que representan las entidades de la DB |
| `routes/`      | Mapeo de endpoints HTTP a controllers                                   |
| `controllers/` | Recibir el request, llamar al service, devolver el response             |
| `services/`    | Lógica de negocio, queries SQL con `pg`                                 |
| `middlewares/` | Validaciones transversales (auth JWT, manejo de errores, etc.)          |

## Variables de entorno (.env)

```
DATABASE_URL=postgres://user:password@localhost:5432/atmos
JWT_SECRET=tu_secret_key
PORT=3000
```

## Convenciones

- Todo en **TypeScript estricto** — no usar `any`
- Los modelos en `models/` son solo **interfaces**, no clases
- Los **queries SQL** viven en los services, nunca en los controllers
- Los controllers son **delgados** — solo manejan HTTP, nada de lógica
- Nombres de archivos en **kebab-case**: `auth.service.ts`, `user.model.ts`
- Nombres de funciones y variables en **camelCase**
- Nombres de interfaces en **PascalCase**: `User`, `AuthPayload`

## Auth flow

1. `POST /auth/register` — recibe email + password, hashea con bcrypt, inserta en DB
2. `POST /auth/login` — verifica credenciales, devuelve JWT
3. Rutas protegidas usan `authMiddleware` que valida el JWT del header `Authorization: Bearer <token>`

## Dependencias principales

```json
{
  "dependencies": {
    "express": "^4.x",
    "pg": "^8.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "@types/express": "^4.x",
    "@types/pg": "^8.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/bcrypt": "^5.x",
    "typescript": "^5.x",
    "ts-node-dev": "^2.x"
  }
}
```

## Próximos pasos

- [ ] Desinstalar Prisma y instalar `pg`
- [ ] Crear estructura de carpetas
- [ ] Implementar `config/db.ts` con pg Pool
- [ ] Definir modelo `User` en `models/`
- [ ] Implementar auth completa (register + login)
- [ ] Conectar con OpenWeatherMap One Call 3.0 para el frontend
