# Requerimientos de "Pantera al Acecho"

## 1. Introducción

### 1.1 Propósito

Desarrollar una aplicación web de gamificación para entornos educativos que automatice el "Juego del Ahorcado", con la temática "Pantera al Acecho". El sistema transforma la dinámica tradicional en una competencia de gestión de recursos y conocimientos entre 4 equipos, eliminando la necesidad de la gestión manual de turnos, conteo de letras, validación de respuestas y cálculos de puntaje, permitiendo que el docente dirija el ritmo de la clase.

### 1.2 Alcance

El sistema es una Single Page Application (SPA) diseñada para ser proyectada en un salón de clases. Gestiona la configuración de frases, el sorteo de turnos, la economía de juego (monedas), el límite de intentos por categoría y la lógica de "Ronda de Repechaje" y "Robo de Frase". Está diseñado para ser operado por un docente desde su equipo de computo.

## 2. Descripción global

### 2.1 Perspectiva del producto

El sistema actúa como soporte visual y lógico central de la clase, reemplazando la intervención manual en el pizarrón. Se compone de tres módulos:

**Módulo de Configuración (Back-office):** Módulo privado donde el docente prepara la sesión. Permite crear, nombrar, editar y eliminar sets de frases, los cuales quedan vinculados a su cuenta y disponibles para clases futuras.

**Motor de Reglas (Automatización):** Controla el límite de intentos, el estado de la pantera (vidas), la validación algorítmica de respuestas y la distribución aleatoria de premios. Ejerce el control final sobre saldos y cumplimiento de límites.

**Interfaz de Proyección:** Tablero visual de alta visibilidad optimizado para pantalla grande y proyector. El docente actúa como operador, ingresando las decisiones verbales de los equipos.

### 2.2 Características del Usuario 

**Operador (Docente):** Ingresa frases, coordina turnos y transcribe las respuestas verbales de los alumnos en el sistema.

**Jugadores (Equipos):** 4 grupos (Rojo, Azul, Amarillo, Verde) que toman decisiones estratégicas basadas en su saldo y sus intentos restantes.

## 3. Requerimientos Funcionales y Lógica de Negocio

### 3.1 Gestión de Turnos y Preparación

**Carga de Frases:** El docente selecciona un set de frases previamente guardado o crea uno nuevo desde el módulo de configuración antes de iniciar la partida.

**Asignación de Premios:** El sistema asigna automáticamente un valor en monedas a cada frase. Los 5 niveles disponibles son: 100, 90, 80, 70 y 60 monedas de oro, distribuidos de forma aleatoria con repetición permitida entre las 8 frases. Todas las tarjetas son visualmente idénticas boca abajo; el valor permanece oculto hasta ser revelado al final del turno.

**Sorteo Inicial:** El sistema realiza un barajado aleatorio de los 4 equipos. Aparecen en posiciones aleatorias en pantalla y el orden de turno es de izquierda a derecha según el resultado.

**Selección de Tarjetas:** En la Ronda 1, cada equipo elige una tarjeta del mazo boca abajo al inicio de su turno. En la Ronda 2, los equipos participantes reciben una tarjeta nueva del mazo sobrante (las 4 frases no jugadas en Ronda 1).

### 3.2 El Sistema de Límite de Intentos

Cada equipo tiene un límite estricto de intentos por frase:

| **Ronda** | **Vocales** | **Consonantes** |
| --- | --- | --- |
| Ronda 1 | 3 | 8 |
| Ronda 2 | 2 | 5 |

> **Consumo:** Cada vez que un equipo pide una letra (gratuita o por compra), se descuenta un intento de su límite de intentos.

> **Restricción:** Si el límite de intentos de una categoría llega a 0, el equipo no puede pedir ni comprar más letras de ese tipo, aunque tenga saldo suficiente. El teclado virtual inhabilita visualmente las letras agotadas.

### 3.3 Economía de Juego (Solo Ronda 1)

| **Concepto** | **Valor** |
| --- | --- |
| Saldo inicial | 200 monedas |
| Costo vocal (Acierto Seguro) | 35 monedas |
| Costo consonante (Acierto Seguro) | 20 monedas |
| Premios (5 niveles aleatorios) | 100, 90, 80, 70 y 60 monedas |

> **Acierto Seguro:** Al comprar, el sistema elige automáticamente una letra correcta de la categoría elegida que aún no haya sido descubierta, la revela en todos sus espacios y descuenta el intento correspondiente. Si no quedan letras disponibles de esa categoría en la frase, el botón de compra se inhabilita. Esta mecánica no está disponible en Ronda 2.

### 3.4 La Pantera al Acecho (Vidas/Errores)

Reemplaza el ahorcado tradicional con una pantera acechando en la selva. Cada error en la opción gratuita avanza la animación un estado. El fondo de selva es permanente; los elementos de la pantera aparecen progresivamente:

- Estado 1: Ojos brillantes en la oscuridad.

- Estado 2: Cabeza y orejas visibles.

- Estado 3: Lomo y cola. Postura de acecho visible.

- Estado 4: Cuerpo completo en tensión, lista para saltar.

- Estado 5 (Derrota): La pantera da un zarpazo que cubre la pantalla. El equipo sufre derrota inmediata sin oportunidad de entrar al Modo Adivinar. Se activa directamente la mecánica de Robo.

### 3.5 Modo Adivinar Frase e Interfaz de Validación

**Activación:** El docente activa este modo mediante un botón dedicado. Puede activarse en dos situaciones: (a) el equipo elige intentarlo voluntariamente en cualquier momento de su turno, o (b) el equipo ha agotado todos sus intentos de letras.

**Interfaz (Relleno Inteligente):** El modal replica el tablero. Las letras ya adivinadas aparecen bloqueadas y pre-rellenadas. El cursor se posiciona automáticamente en los espacios vacíos y salta sobre las letras ya reveladas tras cada pulsación. El docente puede hacer clic en cualquier celda específica para corregir o ingresar una letra manualmente.

**Confirmación oral:** Una vez escrita la respuesta, el docente le pregunta al equipo si esa es su respuesta final. El equipo confirma verbalmente.

**Envío:** El docente presiona Enter o el botón "Adivinar" para que el sistema valide.

**Validación Algorítmica:** El sistema normaliza el texto (ignora mayúsculas, minúsculas y acentos) y compara el intento con la frase objetivo.

- **Si es correcto:** Animación de victoria (tesoro descubierto). El sistema revela la frase y suma el valor del premio al saldo del equipo.

- **Si es incorrecto:** Se activa la mecánica de Robo (solo Ronda 1). La frase se revela al finalizar.

### 3.6 Lógica de Fallo y Robo (Solo Ronda 1)

**Condición de activación:** El equipo llega al Estado 5 de la Pantera al Acecho, o falla en el Modo Adivinar Frase.

**Algoritmo:**

- Los controles del equipo actual se inhabilitan.

- Se habilita únicamente el Modo Adivinar para el equipo siguiente en el orden del sorteo.

- El equipo que roba tiene una única oportunidad: declarar verbalmente la frase completa. No puede pedir letras ni usar monedas.

> - Si acierta: gana las monedas del premio de la tarjeta.

> - Si falla: nadie suma monedas por esa tarjeta.

El proceso termina siempre con la revelación de la frase y una pausa para intervención docente.

### 3.7 Ronda 2 (Repechaje)

**Participantes:** Solo los equipos que no adivinaron su frase en Ronda 1. Los equipos ganadores quedan en modo espectador.

**Condiciones:**

- Sin economía de monedas ni mecánica de Acierto Seguro.

- Intentos reducidos: 2 vocales y 5 consonantes.

- Sin mecánica de Robo; un fallo resulta en derrota directa y revelación de la frase.

### 3.8 Cierre y Revelación Total

Al finalizar todos los turnos de la Ronda 2, o de forma inmediata si ningún equipo requirió repechaje, el sistema revela automáticamente todas las tarjetas no jugadas, mostrando la frase y su valor. Se presenta el marcador final con los saldos de todos los equipos.

## 4. Requisitos No Funcionales

### 4.1 Usabilidad y UI

**Teclado Virtual:** Las letras usadas se marcan visualmente en verde (acierto) o negro (fallo). Las letras agotadas por límite de intentos se inhabilitan visualmente.

**Visibilidad:** Fuentes de gran tamaño y alto contraste optimizadas para proyección en aula. Todos los elementos del panel de control deben ser operables desde la distancia del escritorio del profesor.

**Animaciones:** Las animaciones de victoria (tesoro) y derrota (zarpazo) deben ser llamativas para captar la atención del grupo, pero breves para no interrumpir el ritmo de la clase.

### 4.2 Persistencia y Portabilidad

**Autenticación:** El acceso al sistema requiere inicio de sesión.

**Persistencia de Sets:** Los sets de frases creados por el docente se almacenan en la nube y quedan vinculados a su cuenta, accesibles desde cualquier equipo de cómputo.

**Limitación:** El estado de una partida en curso no se guarda. Si el navegador se recarga durante el juego, la sesión se pierde.

### 4.3 Compatibilidad

Ejecución óptima en Chrome, Firefox y Edge en sus versiones actuales, sobre sistemas vinculados a proyectores. No se requiere soporte para navegadores móviles ni diseño responsivo.