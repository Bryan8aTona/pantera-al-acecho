# Modelo de Datos - Pantera al Acecho

## 1. Visión general

El modelo persiste únicamente los datos de largo plazo: cuentas de docentes y sus sets de frases. El estado de partida nunca se almacena; vive exclusivamente en la memoria del cliente durante la sesión.

Tres tablas principales con una jerarquía lineal:

```
usuarios  ──<  sets  ──<  frases
```

---

## 2. Tablas

### 2.1 `usuarios`

Almacena las cuentas de los docentes. Un usuario puede tener cero o más sets.

| Columna        | Tipo            | Restricciones                        | Descripción                              |
|----------------|-----------------|--------------------------------------|------------------------------------------|
| `id`           | `UUID`          | PK, default `gen_random_uuid()`      | Identificador único del usuario          |
| `email`        | `VARCHAR(255)`  | NOT NULL, UNIQUE                     | Correo electrónico, usado para login     |
| `password_hash`| `VARCHAR(255)`  | NOT NULL                             | Contraseña hasheada (bcrypt)             |
| `nombre`       | `VARCHAR(100)`  | NOT NULL                             | Nombre del docente para mostrar en UI    |
| `created_at`   | `TIMESTAMPTZ`   | NOT NULL, default `now()`            | Fecha de registro                        |

**Índices:** `email` (UNIQUE ya crea índice implícito).

---

### 2.2 `sets`

Agrupaciones de frases creadas por un docente. Un set pertenece a un único usuario y contiene exactamente 8 frases.

| Columna      | Tipo           | Restricciones                              | Descripción                                    |
|--------------|----------------|--------------------------------------------|------------------------------------------------|
| `id`         | `UUID`         | PK, default `gen_random_uuid()`            | Identificador único del set                    |
| `usuario_id` | `UUID`         | NOT NULL, FK → `usuarios(id)` ON DELETE CASCADE | Propietario del set                   |
| `nombre`     | `VARCHAR(100)` | NOT NULL                                   | Nombre descriptivo del set (ej. "Semana 3")    |
| `created_at` | `TIMESTAMPTZ`  | NOT NULL, default `now()`                  | Fecha de creación                              |
| `updated_at` | `TIMESTAMPTZ`  | NOT NULL, default `now()`                  | Última modificación (actualizar en cada PUT)   |

**Índices:** `usuario_id` (para listar sets del docente autenticado).

**Nota:** No hay restricción de unicidad en `nombre` por usuario. El docente puede tener dos sets con el mismo nombre; la distinción es por `id`.

---

### 2.3 `frases`

Frases individuales pertenecientes a un set. Cada set contiene exactamente 8 frases (posiciones 1–8).

| Columna     | Tipo            | Restricciones                            | Descripción                                                    |
|-------------|-----------------|------------------------------------------|----------------------------------------------------------------|
| `id`        | `UUID`          | PK, default `gen_random_uuid()`          | Identificador único de la frase                                |
| `set_id`    | `UUID`          | NOT NULL, FK → `sets(id)` ON DELETE CASCADE | Set al que pertenece                                      |
| `texto`     | `VARCHAR(500)`  | NOT NULL                                 | Frase con ortografía correcta (tildes y mayúsculas preservadas)|
| `orden`     | `SMALLINT`      | NOT NULL                                 | Posición dentro del set (1-based, para mantener el orden de edición) |
| `created_at`| `TIMESTAMPTZ`   | NOT NULL, default `now()`                | Fecha de creación                                              |

**Restricción compuesta:** `UNIQUE (set_id, orden)` - no pueden existir dos frases con el mismo orden dentro del mismo set.

**Nota sobre ortografía:** El texto se almacena con ortografía correcta para mostrarse al revelar la frase al final de cada turno. La normalización (sin tildes, sin mayúsculas) se aplica solo en el motor de reglas del cliente.

---

## 3. Relaciones

| Relación               | Cardinalidad | Comportamiento al eliminar        |
|------------------------|--------------|-----------------------------------|
| `usuarios` → `sets`    | 1 : N        | `ON DELETE CASCADE` (eliminar usuario borra sus sets) |
| `sets` → `frases`      | 1 : N        | `ON DELETE CASCADE` (eliminar set borra sus frases)   |

---

## 4. Esquema Prisma

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  nombre       String   @db.VarChar(100)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  sets         Set[]

  @@map("usuarios")
}

model Set {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  usuarioId  String   @map("usuario_id") @db.Uuid
  nombre     String   @db.VarChar(100)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  usuario    Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  frases     Frase[]

  @@index([usuarioId])
  @@map("sets")
}

model Frase {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  setId     String   @map("set_id") @db.Uuid
  texto     String   @db.VarChar(500)
  orden     Int      @db.SmallInt
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  set       Set      @relation(fields: [setId], references: [id], onDelete: Cascade)

  @@unique([setId, orden])
  @@index([setId])
  @@map("frases")
}
```

---

## 5. Decisiones de diseño

**UUIDs como PKs.** Se prefieren sobre enteros seriales para evitar IDs predecibles en los endpoints REST (`/api/sets/3` expone cuántos sets existen en total). Prisma los genera con `gen_random_uuid()` a nivel de base de datos.

**`ON DELETE CASCADE` en ambas FK.** Eliminar un usuario borra automáticamente sus sets y frases. Eliminar un set borra sus frases. No se necesita soft delete: el back-office del docente gestiona explícitamente sus contenidos.

**`orden` en `frases`.** El back-office presenta 8 inputs fijos (posiciones 1–8) sin posibilidad de reordenamiento. La columna `orden` garantiza que la BD devuelva siempre las frases en el mismo orden al editar o iniciar una partida. 

**8 frases en el back-office.** Una partida requiere exactamente 8 frases (4 por ronda). El back-office impide guardar un set con más o menos de 8 frases; esta situación nunca llega al servidor.

**`updated_at` solo en `sets`.** Las frases no necesitan `updated_at` propio porque siempre se editan en el contexto de su set; el `updated_at` del set refleja cualquier cambio en sus frases.

**Sin tabla de partidas.** Coherente con la decisión arquitectónica central: el estado de la partida vive en memoria del cliente. El servidor no necesita conocer el progreso del juego.

---

## 6. Datos de ejemplo

```sql
-- Usuario
INSERT INTO usuarios (email, password_hash, nombre)
VALUES ('docente@correo.ejemplo', '$2b$10$...', 'Bryan Ochoa');

-- Set
INSERT INTO sets (usuario_id, nombre)
VALUES ('<uuid-usuario>', 'Unidad 2 – Redes');

-- Frases del set
INSERT INTO frases (set_id, texto, orden) VALUES
  ('<uuid-set>', 'El modelo OSI tiene siete capas', 1),
  ('<uuid-set>', 'TCP garantiza la entrega de paquetes', 2),
  ('<uuid-set>', 'DNS traduce nombres a direcciones IP', 3),
  ('<uuid-set>', 'HTTP es un protocolo sin estado', 4),
  ('<uuid-set>', 'Una subred se define con una máscara', 5),
  ('<uuid-set>', 'El protocolo ARP resuelve direcciones MAC', 6),
  ('<uuid-set>', 'FTP usa los puertos 20 y 21', 7),
  ('<uuid-set>', 'SSL y TLS cifran la comunicación en tránsito', 8);
```
