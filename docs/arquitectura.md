# Arquitectura — Pantera al Acecho

## 1. Visión general

El sistema es una Single Page Application (SPA) operada por un docente desde su computadora. Se compone de tres capas: cliente (React), servidor (Node.js + Express) y base de datos (PostgreSQL).

El **estado de la partida vive exclusivamente en la memoria del cliente**. Si el navegador se recarga durante el juego, la sesión se pierde. El servidor solo persiste datos de largo plazo: cuentas de docentes y sets de frases.

---

## 2. Diagramas de arquitectura

### 2.1 Diagrama de Contexto
Muestra el sistema desde afuera: quién lo usa y cuál es su propósito. No detalla tecnologías ni componentes internos.

![Diagrama de contexto](img/arquitectura-contexto.png)

### 2.2 Diagrama de Capas
Muestra los tres bloques principales del sistema (cliente, servidor y base de datos), las tecnologías que los conforman y cómo se comunican entre sí.

![Diagrama de capas](img/arquitectura-capas.png)

### 2.3 Diagrama de Módulos
Muestra el interior de cada capa: los módulos que la componen y las relaciones entre ellos. 

![Diagrama de módulos](img/arquitectura-modulos.png)

---

## 3. Módulos del cliente

Los módulos del cliente siguen un flujo secuencial: el docente inicia sesión, gestiona sus sets de frases, configura la partida y opera el tablero durante el juego.

### 3.1 Login
Pantalla de acceso al sistema. El docente ingresa sus credenciales para autenticarse. Es la puerta de entrada a todos los demás módulos.

### 3.2 Back-office
Módulo privado accesible solo tras autenticación. Permite al docente crear, nombrar, editar y eliminar sets de frases. Los sets quedan vinculados a su cuenta y disponibles para sesiones futuras.

### 3.3 Configuración de partida
Pantalla previa al juego donde el docente selecciona el set de frases a usar e inicia la partida. Al iniciar, el cliente precarga el set seleccionado junto con todas las frases que lo componen, manteniendo esta información en memoria durante toda la sesión.

### 3.4 Tablero de juego
Interfaz de alta visibilidad optimizada para proyección en aula. Muestra el estado de los 4 equipos, el teclado virtual, la animación de la pantera y los controles del docente. Toda la lógica del juego, como la validación de letras y frases, corre aquí en memoria.

Para proteger contra recargas accidentales, el sistema detecta si hay una partida activa y activa la advertencia estándar del navegador ("¿Seguro que quieres salir?") si el docente intenta cerrar o recargar la pestaña, dándole una red de seguridad antes de perder la sesión.

### 3.5 Motor de reglas (cliente)
Módulo dentro del cliente que contiene toda la lógica de negocio del juego:

- Validación de letras y frases (normalización al momento: sin tildes ni mayúsculas)
- Control de límites de intentos por categoría y ronda
- Economía de monedas y lógica de Acierto Seguro
- Máquina de estados: sorteo, turnos, robo, repechaje, cierre

> **Nota sobre normalización:** Las frases se almacenan en la base de datos con su ortografía correcta (tildes, mayúsculas) para mostrarse correctamente al final del turno. La normalización se aplica únicamente al momento de comparar la respuesta del equipo con la frase objetivo.

> **Nota sobre el modelo de amenaza:** La aplicación la opera el docente desde su propio equipo, proyectado al grupo. Los alumnos no tienen acceso al navegador ni a DevTools. Cargar las frases completas en el cliente no representa un riesgo de seguridad en este contexto.

---

## 4. Módulos del servidor

### 4.1 Auth
Maneja el registro e inicio de sesión de los docentes. Al ingresar, el servidor emite una credencial de acceso (Token JWT) que el navegador del docente guarda localmente. Esta credencial se adjunta automáticamente en cada petición privada.

**Almacenamiento de la credencial:** Se guarda en el almacenamiento local del navegador por simplicidad. Al ser un sistema operado únicamente por el docente en su propio equipo y para un entorno universitario, este método es suficiente y simplifica el desarrollo.

### 4.2 API sets de frases
CRUD completo de sets de frases vinculados al usuario autenticado. Al iniciar una partida, el cliente descarga el set seleccionado completo con un único GET.

| Método | Ruta                  | Descripción                        |
|--------|-----------------------|------------------------------------|
| GET    | /api/sets             | Listar sets del docente            |
| POST   | /api/sets             | Crear nuevo set                    |
| PUT    | /api/sets/:id         | Editar set existente               |
| DELETE | /api/sets/:id         | Eliminar set                       |
| GET    | /api/sets/:id/frases  | Obtener frases completas de un set |

---

## 5. Base de datos

Motor: **PostgreSQL**
ORM: **Prisma**
Despliegue: **A definir**

### Tablas principales

- `usuarios` — cuentas de docentes
- `sets` — agrupaciones de frases vinculadas a un usuario
- `frases` — frases individuales pertenecientes a un set, almacenadas con ortografía correcta

> El modelo de datos detallado (campos, tipos, relaciones y restricciones) se documenta en `modelo-datos.md`.

---

## 6. Comunicación entre capas

- Cliente → Servidor: **REST API sobre HTTPS**, validando la identidad en cada petición mediante el Token JWT guardado en el navegador del docente.
- Servidor → BD: Las consultas se realizan mediante **Prisma ORM**, el cual gestiona automáticamente las conexiones para mantener el rendimiento del servidor.
- El estado de partida **nunca viaja al servidor**; es exclusivo del cliente durante la sesión.

---

## 7. Stack tecnológico

| Capa          | Tecnología               |
|---------------|--------------------------|
| Frontend      | React + Vite             |
| Backend       | Node.js + Express        |
| Base de datos | PostgreSQL               |
| ORM           | Prisma                   |
| Autenticación | JWT                      |
| Despliegue    | A definir                |

---

## 8. Decisión de diseño

La decisión central de esta arquitectura es concentrar toda la lógica del juego en el cliente. Dado que la aplicación es operada exclusivamente por el docente desde su propio equipo y los alumnos no tienen acceso al navegador, no existe un riesgo real de manipulación. Esto permite descargar el set de frases completo al inicio de la partida y ejecutar toda la validación, el control de intentos y la economía de monedas en memoria, sin depender del servidor durante el juego. Como resultado, el backend queda reducido a dos responsabilidades concretas (autenticación y persistencia de sets) lo que simplifica el desarrollo y elimina latencia en cada interacción.
