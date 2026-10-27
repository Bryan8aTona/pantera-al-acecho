import { frasesConId } from './frases.js';

// Set fijo del modo invitado ("Probar sin cuenta"): vive en el cliente,
// no en Firestore, así que se puede jugar sin cuenta y sin red hacia la
// base de datos. Misma forma que un set descargado por obtenerSet().
export const SET_EJEMPLO = {
  id: 'ejemplo',
  nombre: 'Ciencias naturales (ejemplo)',
  frases: frasesConId([
    { orden: 1, texto: 'LA FOTOSÍNTESIS' },
    { orden: 2, texto: 'EL CICLO DEL AGUA' },
    { orden: 3, texto: 'EL SISTEMA SOLAR' },
    { orden: 4, texto: 'LA CADENA ALIMENTICIA' },
    { orden: 5, texto: 'LA CÉLULA ANIMAL' },
    { orden: 6, texto: 'LA SELVA TROPICAL' },
    { orden: 7, texto: 'LAS TELARAÑAS' },
    { orden: 8, texto: 'LOS VOLCANES' },
  ]),
};
