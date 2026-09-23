# Modelo de Datos - Pantera al Acecho

## 1. Visión general

El modelo persiste únicamente los datos de largo plazo: **los sets de frases** de cada docente. El estado de partida nunca se almacena; vive exclusivamente en la memoria del cliente durante la sesión.

La persistencia usa dos servicios de Firebase:

- **Firebase Authentication** — las cuentas de los docentes (email, contraseña, nombre para mostrar). No hay tabla/colección de usuarios propia: Firebase Auth es el registro de identidades y expone `uid`, `email` y `displayName`.
- **Cloud Firestore** — una sola colección, `sets`, con un documento por set.

```
Firebase Auth (usuarios)  ──<  Firestore: sets
        uid                      sets/{setId}.ownerUid
```

---

## 2. Autenticación (Firebase Auth)

Cada docente es un usuario de Firebase Auth con proveedor **Email/Password**. Los datos relevantes:

| Campo         | Origen                        | Uso                                            |
|---------------|-------------------------------|------------------------------------------------|
| `uid`         | Firebase (inmutable)          | Dueño de cada set (`ownerUid`)                 |
| `email`       | Registro / login             | Identificación de la cuenta                     |
| `displayName` | Se fija con `updateProfile` al registrarse | Nombre del docente mostrado en el back-office |

La contraseña la gestiona Firebase (hash y verificación); la aplicación nunca la ve ni la almacena. La sesión persiste sola en el navegador y se sincroniza con `onAuthStateChanged`.

---

## 3. Colección `sets` (Firestore)

Un documento por set de frases. El `id` del documento lo genera Firestore (`addDoc`).

| Campo       | Tipo                     | Descripción                                                        |
|-------------|--------------------------|--------------------------------------------------------------------|
| `ownerUid`  | `string`                 | `uid` del docente dueño (Firebase Auth). Base de todas las reglas. |
| `nombre`    | `string`                 | Nombre descriptivo del set (ej. "Unidad 2 – Redes"). Máx. 100.     |
| `frases`    | `array<{ orden, texto }>`| Exactamente 8 elementos. `orden` 1–8 sin repetir; `texto` con ortografía correcta (tildes y mayúsculas), máx. 500. |
| `createdAt` | `timestamp`              | `serverTimestamp()` al crear.                                      |
| `updatedAt` | `timestamp`              | `serverTimestamp()` en cada guardado. Ordena la lista del back-office. |

Ejemplo de documento:

```json
{
  "ownerUid": "a1B2c3D4e5F6g7H8i9J0kLmNoPq2",
  "nombre": "Unidad 2 – Redes",
  "frases": [
    { "orden": 1, "texto": "El modelo OSI tiene siete capas" },
    { "orden": 2, "texto": "TCP garantiza la entrega de paquetes" },
    { "orden": 3, "texto": "DNS traduce nombres a direcciones IP" },
    { "orden": 4, "texto": "HTTP es un protocolo sin estado" },
    { "orden": 5, "texto": "Una subred se define con una máscara" },
    { "orden": 6, "texto": "El protocolo ARP resuelve direcciones MAC" },
    { "orden": 7, "texto": "FTP usa los puertos 20 y 21" },
    { "orden": 8, "texto": "SSL y TLS cifran la comunicación en tránsito" }
  ],
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

> **Nota sobre ortografía.** El texto se guarda con ortografía correcta para mostrarse al revelar la frase al final de cada turno. La normalización (sin tildes, sin mayúsculas) se aplica solo en el motor de reglas del cliente — y preserva la Ñ como letra distinta, no como una "N acentuada". Ver `arquitectura.md` sección 3.5.

> **`id` de frase.** Las frases se guardan solo como `{ orden, texto }`. El cliente (`client/src/lib/sets.js`) sintetiza un `id` estable por frase al leer el set (`f1`…`f8`, derivado de `orden`), porque el motor de juego indexa el mazo por `frase.id`. No se persiste.

---

## 4. Reglas de seguridad (`firestore.rules`)

Toda la autorización vive en las reglas; no hay servidor intermediario. Un set solo es accesible por su dueño, y solo puede crearse/actualizarse si cumple los mismos límites que el formulario del back-office: nombre de 1–100 caracteres y exactamente 8 frases, cada una de 1–500 caracteres, con `orden` 1..8 sin repetir (el cliente las guarda ordenadas, así que basta con `frases[i].orden == i + 1`).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function fraseValida(frase, orden) {
      return frase.orden == orden
          && frase.texto is string
          && frase.texto.size() > 0
          && frase.texto.size() <= 500;
    }

    function setValido(data) {
      return data.nombre is string
          && data.nombre.size() > 0
          && data.nombre.size() <= 100
          && data.frases is list
          && data.frases.size() == 8
          && fraseValida(data.frases[0], 1)
          && …                               // una por cada posición
          && fraseValida(data.frases[7], 8);
    }

    match /sets/{setId} {
      allow read: if request.auth != null
                  && resource.data.ownerUid == request.auth.uid;
      allow create: if request.auth != null
                    && request.resource.data.ownerUid == request.auth.uid
                    && setValido(request.resource.data);
      allow update: if request.auth != null
                    && resource.data.ownerUid == request.auth.uid
                    && request.resource.data.ownerUid == request.auth.uid
                    && setValido(request.resource.data);
      allow delete: if request.auth != null
                    && resource.data.ownerUid == request.auth.uid;
    }
  }
}
```

El listado del back-office (`where('ownerUid', '==', uid)`) es coherente con la regla `read`: cada documento devuelto cumple `ownerUid == request.auth.uid`. No se usa `orderBy` en la consulta (el orden por `updatedAt` se hace en el cliente), así que no hace falta un índice compuesto.

---

## 5. Decisiones de diseño

**Firebase Auth en vez de una colección `usuarios` propia.** Registro, verificación de contraseña y persistencia de sesión los resuelve Firebase sin código propio ni almacenar hashes. El `displayName` cubre la única necesidad de perfil (nombre para la UI).

**Las frases como campo `array` dentro del set, no como subcolección.** Un set son siempre 8 frases pequeñas que se leen y se escriben juntas. Un array las hace atómicas (un `addDoc`/`updateDoc` guarda el set completo), evita 8 lecturas extra al abrir un set o iniciar una partida, y permite validar el conteo (`frases.size() == 8`) directamente en las reglas.

**`ownerUid` en cada documento.** Es la única pieza de autorización. Se compara contra `request.auth.uid` en las reglas y contra `auth.currentUser.uid` en el cliente antes de devolver o modificar (para dar un mensaje claro).

**Sin `orderBy` en la consulta de listado.** Un docente tiene pocos sets; ordenarlos por `updatedAt` en memoria del cliente evita tener que declarar y desplegar un índice compuesto en Firestore.

**Sin colección de partidas.** Coherente con la decisión arquitectónica central: el estado de la partida vive en memoria del cliente. Firestore no necesita conocer el progreso del juego.

**IDs de documento autogenerados.** Firestore genera el `id` de cada set; no se exponen en URLs públicas (el back-office es privado) y no revelan conteos.
