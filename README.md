# Pantera al Acecho

Videojuego educativo para el repaso en clase. Es una versión gamificada del
juego del ahorcado: cuatro equipos compiten adivinando frases que arma el
docente, administrando monedas y turnos. La aplicación la opera **un solo
docente** desde su computadora, proyectando la pantalla al grupo.

Es una SPA de React. No hay servidor propio: la autenticación y la
persistencia de los sets de frases se apoyan en **Firebase**
(Authentication + Cloud Firestore), y toda la lógica del juego corre en el
navegador.

## Documentación del proyecto

| Documento | Contenido |
| --- | --- |
| [`docs/requerimientos.md`](docs/requerimientos.md) | Qué debe hacer el sistema — fuente de verdad de producto (reglas del juego, economía, rondas). |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Cómo está construido — módulos del cliente, motor de reglas, Firebase, stack, estrategia de pruebas. |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Datos persistidos: Firebase Auth y la colección `sets` de Firestore, con sus reglas de seguridad. |

## Stack

- **Frontend:** React 18 + Vite 5, React Router 6, CSS plano co-localizado + una
  hoja global. El estado de la partida vive **solo en memoria del cliente**;
  recargar el navegador durante el juego pierde la sesión.
- **Motor de juego:** módulos JavaScript puros en `client/src/motor/` (sin
  React), conectados a la UI con un reducer. Toda la lógica de reglas corre en
  el cliente.
- **Autenticación:** Firebase Authentication (email/contraseña).
- **Persistencia:** Cloud Firestore (`firebase/firestore/lite`), una sola
  colección `sets`. La autorización vive en `firestore.rules`.
- **Hosting:** Firebase Hosting (sitio estático).
- **Pruebas:** Vitest + Testing Library (jsdom) en el cliente — 109 pruebas.

## Estructura del repositorio

```
pantera-al-acecho/
├── client/                 SPA React + Vite (toda la aplicación)
│   ├── public/assets/      logo, videos de la pantera, sonidos, imágenes de cartas
│   └── src/
│       ├── motor/          motor de reglas puro (+ pruebas unitarias)
│       ├── hooks/          usePartidaEngine, secuencias dramáticas, sonido…
│       ├── context/        AuthContext (Firebase Auth), PartidaContext (estado en memoria)
│       ├── components/     UI compartida + components/tablero/ (pantalla de juego)
│       ├── pages/          Home, Login, Back-office, Configuración, Tablero
│       └── lib/            firebase.js (init) y sets.js (CRUD en Firestore)
├── firebase.json           configuración de Firebase Hosting + Firestore
├── firestore.rules         reglas de seguridad de Firestore
├── .firebaserc             proyecto de Firebase por defecto
└── docs/
```

## Requisitos previos

- **Node.js 20 LTS** o superior.
- Una cuenta de **Firebase** con un proyecto (plan Spark, gratuito) que tenga
  habilitados **Authentication → Email/Password** y **Cloud Firestore**.
- `firebase-tools` para desplegar: `npm install -g firebase-tools`.

## Puesta en marcha (desarrollo)

```bash
cd client
npm install
cp .env.example .env      # y pega los valores de tu proyecto de Firebase
npm run dev               # http://localhost:5173
```

Variables de entorno del cliente (`client/.env`) — se obtienen en la consola de
Firebase → *Configuración del proyecto → Tus apps → Web*. No son secretas
(identifican el proyecto; la seguridad la dan Auth y las reglas):

| Variable | Ejemplo |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `AIza…` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `mi-proyecto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `mi-proyecto` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `mi-proyecto.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `460074117911` |
| `VITE_FIREBASE_APP_ID` | `1:460074117911:web:…` |

`localhost` ya está autorizado en Firebase Auth por defecto; no hay que
configurar nada más para desarrollo.

### Primer docente

No hay seed: la primera cuenta se crea desde la pantalla de **Login → Crear
cuenta** de la propia aplicación (nombre, email, contraseña de 8+ caracteres).

## Comandos útiles

| Ubicación | Comando | Efecto |
| --- | --- | --- |
| `client/` | `npm run dev` | Servidor de desarrollo Vite. |
| `client/` | `npm test` | Ejecuta las 109 pruebas (Vitest). |
| `client/` | `npm run build` | Build de producción en `client/dist/`. |
| `client/` | `npm run preview` | Sirve el build de producción localmente. |
| raíz | `firebase deploy` | Publica Hosting + reglas de Firestore. |
| raíz | `firebase deploy --only firestore:rules` | Publica solo las reglas. |
| raíz | `firebase deploy --only hosting` | Publica solo el sitio. |

## Datos: colección `sets` (Firestore)

Un documento por set de frases:

```json
{
  "ownerUid": "<uid del docente>",
  "nombre": "Unidad 2 – Redes",
  "frases": [{ "orden": 1, "texto": "…" }, "… ×8"],
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

Acceso encapsulado en `client/src/lib/sets.js`. Reglas en `firestore.rules`:
cada set solo es accesible por su dueño y solo se guarda con exactamente 8
frases. Detalle completo en [`docs/modelo-datos.md`](docs/modelo-datos.md).

## Rutas del cliente (SPA)

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/` | Pública | Home: qué es el juego, cómo se juega, manual del docente. |
| `/login` | Pública | Alta / inicio de sesión (Firebase Auth). |
| `/panel` | Privada | Back-office: gestión de sets de frases. |
| `/sets/nuevo`, `/sets/:id/editar` | Privada | Formulario de set (página completa). |
| `/configuracion-partida` | Privada | Selección de set e inicio de partida. |
| `/partida` | Privada | Tablero de juego (proyección en aula). |

Cualquier ruta desconocida redirige a `/`. Un docente ya autenticado que entra
a `/` es redirigido a `/panel`.

## Despliegue

```bash
npm install -g firebase-tools
firebase login
cd client && npm run build && cd ..
firebase deploy
```

Esto sube `client/dist/` a Firebase Hosting (con el fallback de SPA a
`index.html` ya configurado en `firebase.json`) y publica `firestore.rules`.
La URL queda como `https://<project-id>.web.app`.

Requisitos por única vez en la consola de Firebase:

1. **Authentication → Sign-in method → Email/Password → habilitar.**
2. **Firestore Database → crear** (modo producción; las reglas del repo lo
   restringen correctamente).
3. El dominio de Hosting (`<project-id>.web.app`) se autoriza solo para Auth
   al desplegar.

Actualizaciones posteriores: `cd client && npm run build && cd .. && firebase deploy`.

## Pruebas

`cd client && npm test` — el motor de reglas (`src/motor/__tests__/`) y la
integración de las secuencias dramáticas de React bajo `StrictMode`
(`src/**/__tests__/`). La capa de Firebase se verifica manualmente. Ver
`docs/arquitectura.md` §7.1.
