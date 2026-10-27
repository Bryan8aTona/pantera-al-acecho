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

**Motor de Reglas (Automatización):** Controla el límite de intentos, el estado de la pantera (vidas), la validación algorítmica de respuestas y la bolsa de monedas de cada tarjeta. Ejerce el control final sobre saldos y cumplimiento de límites.

**Interfaz de Proyección:** Tablero visual de alta visibilidad optimizado para pantalla grande y proyector. El docente actúa como operador, ingresando las decisiones verbales de los equipos.

### 2.2 Características del Usuario 

**Operador (Docente):** Ingresa frases, coordina turnos y transcribe las respuestas verbales de los alumnos en el sistema.

**Jugadores (Equipos):** 4 grupos (Rojo, Azul, Amarillo, Verde) que toman decisiones estratégicas basadas en la bolsa de la tarjeta, sus intentos restantes y las vidas que les quedan.

## 3. Requerimientos Funcionales y Lógica de Negocio

### 3.1 Gestión de Turnos y Preparación

**Carga de Frases:** El docente selecciona un set de frases previamente guardado o crea uno nuevo desde el módulo de configuración antes de iniciar la partida.

**Bolsa de la tarjeta:** Cada tarjeta tiene una bolsa de monedas que se calcula a partir de su frase: 50 monedas más 5 por cada letra distinta (sin contar espacios, mayúsculas ni tildes; la Ñ cuenta como letra propia). Las frases más largas y variadas valen más. Todas las tarjetas son visualmente idénticas boca abajo; la bolsa se descubre al elegir la tarjeta y baja en vivo mientras se juega (ver 3.3).

**Sorteo Inicial:** El sistema realiza un barajado aleatorio de los 4 equipos. Aparecen en posiciones aleatorias en pantalla y el orden de turno es de izquierda a derecha según el resultado.

**Barajado de Frases:** Al iniciar cada partida el sistema baraja las 8 frases del set. El número que muestra cada tarjeta boca abajo es su posición en el mazo barajado, no la posición de la frase en el set, así que un mismo set no reparte siempre la misma frase detrás del mismo número.

**Demostración previa:** Al abrir el Tablero, antes de que empiece el juego, se muestra encima de él una ventana emergente con una demostración animada de cómo se juega (un equipo que pide letras, falla, usa un Acierto Seguro y adivina la frase; y otro que llega al zarpazo y deja la frase en Robo), con los mismos videos de la pantera y la misma bolsa de monedas del juego. No avanza sola: el docente pasa de un paso a otro, o regresa a cualquiera, con las bolitas, las flechas del teclado o los botones, al ritmo de su explicación. La cierra con su botón, con Esc o con un clic fuera de ella; el tablero no se puede operar hasta entonces.

**Selección de Tarjetas:** En la Ronda 1, cada equipo elige una tarjeta del mazo boca abajo al inicio de su turno. En la Ronda 2, los equipos participantes reciben una tarjeta nueva del mazo sobrante (las 4 frases no jugadas en Ronda 1). Una vez elegida su tarjeta, el equipo no puede cambiarla ni elegir otra durante ese turno.

### 3.2 El Sistema de Límite de Intentos

Cada equipo tiene un límite estricto de intentos por frase:

| **Ronda** | **Vocales** | **Consonantes** |
| --- | --- | --- |
| Ronda 1 | 3 | 8 |
| Ronda 2 | 2 | 5 |

> **Consumo:** Cada vez que un equipo pide una letra (al aire o con Acierto Seguro), se descuenta un intento de su límite de intentos.

> **Restricción:** Si el límite de intentos de una categoría llega a 0, el equipo no puede pedir más letras de ese tipo, ni al aire ni con Acierto Seguro. El teclado virtual inhabilita visualmente las letras agotadas.

### 3.3 Economía de Juego: la Bolsa

Los equipos no gastan su saldo: lo que cuesta cada ayuda sale de la bolsa de la tarjeta en juego, así que cada letra que piden hace que la tarjeta valga menos. El equipo que adivina la frase se lleva lo que quede en la bolsa.

| **Concepto** | **Valor** |
| --- | --- |
| Saldo inicial | 0 monedas |
| Bolsa de la tarjeta | 50 + 5 por cada letra distinta de la frase |
| Cada letra pedida al aire (acierte o falle) | −5 a la bolsa |
| Acierto Seguro (vocal o consonante) | −15 a la bolsa |

> **Piso en 0:** La bolsa nunca baja de 0. Con la bolsa vacía el equipo puede seguir jugando, pero adivinar ya no le suma monedas.

> **En pantalla:** Al elegir la tarjeta, la bolsa cae junto a ella y cuenta sus monedas. Cada letra pedida le saca monedas con una animación y un sonido; cuando le quedan 30 o menos se pone en rojo y tiembla, y vacía se ve gris con una polilla.

> **Acierto Seguro:** Al usarlo, el sistema elige automáticamente una letra correcta de la categoría elegida que aún no haya sido descubierta, la revela en todos sus espacios, descuenta el intento correspondiente y le quita 15 monedas a la bolsa. No depende del saldo del equipo. Si no quedan letras disponibles de esa categoría en la frase, el botón se inhabilita. Esta mecánica no está disponible en Ronda 2.

### 3.4 La Pantera al Acecho (Vidas/Errores)

Reemplaza el ahorcado tradicional con una pantera acechando en la selva. Cada error en la opción gratuita avanza la animación un estado. El fondo de selva es permanente; los elementos de la pantera aparecen progresivamente:

- Estado 1: Ojos brillantes en la oscuridad.

- Estado 2: Cabeza y orejas visibles.

- Estado 3: Lomo y cola. Postura de acecho visible.

- Estado 4: Cuerpo completo en tensión, lista para saltar.

- Estado 5 (Derrota): La pantera da un zarpazo que cubre la pantalla. El equipo sufre derrota inmediata sin oportunidad de entrar al Modo Adivinar. Se activa directamente la mecánica de Robo.

> **Nota:** la pantera solo avanza por errores en la opción gratuita (letras al aire). El Acierto Seguro, al acertar siempre por diseño, nunca la hace avanzar.

> **Vidas en pantalla:** Sobre el video de la pantera se muestran 5 corazones, las vidas que le quedan al equipo en turno; cada error apaga uno. Para que el equipo sienta la tensión de ir perdiendo: con 2 vidas aparece "¡Cuidado!" y empieza a sonar un latido, acompañado de un borde rojo tenue que late alrededor de la pantalla y de los corazones que laten al mismo ritmo; con la última vida aparece "¡Última vida!" y el borde rojo se intensifica. El latido calla mientras se reproduce el video de la pantera.

### 3.5 Modo Adivinar Frase e Interfaz de Validación

**Activación:** El docente activa este modo mediante el botón "Adivinar Frase", ubicado encima del teclado virtual y resaltado en dorado para que se distinga desde lejos. Puede activarse en tres situaciones: (a) el equipo elige intentarlo voluntariamente en cualquier momento de su turno, (b) el equipo ha agotado todos sus intentos de letras, o (c) el equipo revela todas las letras de la frase mediante la opción gratuita o el Acierto Seguro, en este último caso, el sistema otorga la victoria automáticamente en cuanto la última letra queda descubierta, sin requerir que el docente confirme manualmente a través del botón "Adivinar".

**Interfaz (Relleno Inteligente):** El modal replica el tablero. Las letras ya adivinadas aparecen bloqueadas y pre-rellenadas. El cursor se posiciona automáticamente en los espacios vacíos y salta sobre las letras ya reveladas tras cada pulsación. El docente puede hacer clic en cualquier celda específica para corregir o ingresar una letra manualmente.

**Confirmación oral:** Una vez escrita la respuesta, el docente le pregunta al equipo si esa es su respuesta final. El equipo confirma verbalmente.

**Envío:** El docente presiona Enter o el botón "Adivinar" para que el sistema valide.

**Rendirse:** Cuando el equipo está declarando la frase (en el Modo Adivinar, voluntario u obligatorio por haber agotado sus intentos, o al robar) y no la sabe, el docente presiona "Rendirse". Se resuelve exactamente igual que una respuesta incorrecta: en Ronda 1 activa el Robo (o, si ya era el robo, nadie gana la carta) y en Ronda 2 es derrota directa.

**Validación Algorítmica:** El sistema normaliza el texto (ignora mayúsculas, minúsculas y acentos) y compara el intento con la frase objetivo.

- **Si es correcto:** Animación de victoria: la bolsa revienta y suelta sus monedas con el nombre del equipo y el premio. La escena se queda en pantalla hasta que el docente da clic (o Enter); entonces las monedas vuelan al panel del equipo y su saldo sube con una celebración. El sistema revela la frase y suma al saldo lo que quedaba en la bolsa.

- **Si es incorrecto:** Se activa la mecánica de Robo (solo Ronda 1). La frase se revela al finalizar.

### 3.6 Lógica de Fallo y Robo (Solo Ronda 1)

**Condición de activación:** El equipo llega al Estado 5 de la Pantera al Acecho, o falla en el Modo Adivinar Frase.

**Algoritmo:**

- Los controles del equipo actual se inhabilitan.

- Se habilita únicamente el Modo Adivinar para el equipo siguiente en el orden del sorteo original, de forma circular: si el equipo que pierde es el último de ese orden, le toca robar al primero, incluso si ese equipo ya jugó su propio turno antes en la ronda.

- El equipo que roba ve en pantalla las letras que ya estaban reveladas al momento del fallo — no parte de una frase en blanco. Tiene una única oportunidad: declarar verbalmente la frase completa. No puede pedir letras ni usar Acierto Seguro. La bolsa aparece en pantalla con lo que quedó tras el turno del equipo que falló.

> - Si acierta: se lleva lo que quedaba en la bolsa.

> - Si falla: nadie suma monedas por esa tarjeta.

- Resuelto el robo (con o sin éxito), el equipo que robó continúa normalmente con su propio turno y su propia tarjeta — robar no le adelanta ni le consume su turno.

El proceso termina siempre con la revelación de la frase completa y una pausa para intervención docente antes de continuar. Esto aplica a **cualquier** tarjeta que se resuelva, sea por turno propio, robo exitoso, robo fallido, o derrota directa en Ronda 2 — nada avanza al siguiente equipo de forma automática.

### 3.7 Ronda 2 (Repechaje)

**Participantes:** Solo los equipos que no adivinaron su frase en Ronda 1. Los equipos ganadores quedan en modo espectador. El estado de la pantera se reinicia para todos los equipos participantes al comenzar esta ronda.

**Condiciones:**

- Sin Acierto Seguro. La bolsa funciona igual que en Ronda 1: cada letra pedida le quita 5 monedas y un acierto suma al saldo lo que quede en ella.

- Intentos reducidos: 2 vocales y 5 consonantes.

- Sin mecánica de Robo; un fallo resulta en derrota directa y revelación de la frase.

### 3.8 Cierre y Revelación Total

Al finalizar todos los turnos de la Ronda 2, o de forma inmediata si ningún equipo requirió repechaje, el sistema revela automáticamente todas las tarjetas no jugadas, mostrando solo su frase. Se presenta el marcador final con los saldos de todos los equipos.

## 4. Requisitos No Funcionales

### 4.1 Usabilidad y UI

**Teclado Virtual:** Las letras usadas se marcan visualmente en verde (acierto) o negro (fallo). Las letras agotadas por límite de intentos se inhabilitan visualmente.

**Visibilidad:** Fuentes de gran tamaño y alto contraste optimizadas para proyección en aula. Toda la interfaz de juego debe caber en una sola pantalla, sin necesidad de desplazamiento. Todos los elementos del panel de control deben ser operables desde la distancia del escritorio del profesor.

**Animaciones:** Las animaciones de victoria (la bolsa que revienta) y derrota (zarpazo) deben ser llamativas para captar la atención del grupo, pero breves para no interrumpir el ritmo de la clase.

**Panel de equipo:** cada uno de los 4 paneles debe mostrar el nombre del equipo en una pestaña sobre el borde superior, el saldo actual con un ícono de moneda, y los intentos restantes de vocales y consonantes, todo dentro de un marco con efecto de relieve. Cuando es el turno de un equipo, su panel se destaca con un resplandor en el color propio del equipo y una etiqueta "En turno" en verde fosforescente; cuando un equipo puede robar la frase, se marca con una etiqueta distinta en el color de acento dorado.

**Identidad visual:** las pantallas administrativas (inicio de sesión, back-office, configuración de partida, gestión de sets) usan la paleta institucional de la UAM (naranja). El Tablero de juego mantiene su propia paleta temática (verde selva), independiente de la identidad institucional.

### 4.2 Persistencia y Portabilidad

**Autenticación:** El acceso al sistema requiere inicio de sesión. Los docentes pueden crear sus propias cuentas mediante un formulario de registro sencillo; sin embargo, la versión actual no cuenta con recuperación automatizada de credenciales. En caso de olvido de contraseña, el usuario deberá solicitar el restablecimiento directamente al administrador.

**Modo invitado:** Desde la portada o el inicio de sesión, el botón "Probar sin cuenta" abre directamente el Tablero con un set de ejemplo de 8 frases incluido en la aplicación, sin registrarse. El invitado juega una partida completa, pero no puede crear, editar ni guardar sets; al salir de la partida vuelve a la portada.

**Persistencia de Sets:** Los sets de frases creados por el docente se almacenan en la nube y quedan vinculados a su cuenta, accesibles desde cualquier equipo de cómputo.

**Limitación:** El estado de una partida en curso no se guarda. Si el navegador se recarga durante el juego, la sesión se pierde.

### 4.3 Compatibilidad

Ejecución óptima en Chrome, Firefox y Edge en sus versiones actuales, sobre sistemas vinculados a proyectores. No se requiere soporte para navegadores móviles ni diseño responsivo.
