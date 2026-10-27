import { describe, it, expect, beforeEach } from 'vitest';
import { listarSets, obtenerSet, crearSet, actualizarSet, eliminarSet } from '../sets.js';
import { limpiarEmuladores, entrarComo, salir, frasesValidas } from './emulador.js';

// lib/sets.js contra los emuladores: el CRUD que usa el back-office y
// la Configuración de partida, con las reglas reales de firestore.rules.

beforeEach(limpiarEmuladores);

describe('sets.js — CRUD del docente', () => {
  it('crea un set y lo lista', async () => {
    await entrarComo('ana');
    const id = await crearSet({ nombre: '  Historia  ', frases: frasesValidas() });

    expect(await listarSets()).toEqual([{ id, nombre: 'Historia', updatedAt: expect.any(Date) }]);
  });

  it('lista primero el set modificado más recientemente', async () => {
    await entrarComo('ana');
    const viejo = await crearSet({ nombre: 'Viejo', frases: frasesValidas() });
    const nuevo = await crearSet({ nombre: 'Nuevo', frases: frasesValidas() });
    expect((await listarSets()).map((s) => s.id)).toEqual([nuevo, viejo]);

    await actualizarSet(viejo, { nombre: 'Viejo editado', frases: frasesValidas() });
    expect((await listarSets()).map((s) => s.id)).toEqual([viejo, nuevo]);
  });

  it('obtenerSet devuelve las 8 frases ordenadas, recortadas y con id', async () => {
    await entrarComo('ana');
    const desordenadas = frasesValidas()
      .reverse()
      .map((f) => ({ ...f, texto: `  ${f.texto}  ` }));
    const id = await crearSet({ nombre: 'Ciencias', frases: desordenadas });

    const set = await obtenerSet(id);
    expect(set.nombre).toBe('Ciencias');
    expect(set.frases).toEqual(frasesValidas().map((f) => ({ ...f, id: `f${f.orden}` })));
  });

  it('actualiza el nombre y las frases', async () => {
    await entrarComo('ana');
    const id = await crearSet({ nombre: 'Antes', frases: frasesValidas() });
    const frases = frasesValidas().map((f) => ({ ...f, texto: `Nueva ${f.orden}` }));

    await actualizarSet(id, { nombre: 'Después', frases });

    const set = await obtenerSet(id);
    expect(set.nombre).toBe('Después');
    expect(set.frases[0].texto).toBe('Nueva 1');
  });

  it('elimina un set', async () => {
    await entrarComo('ana');
    const id = await crearSet({ nombre: 'Temporal', frases: frasesValidas() });

    await eliminarSet(id);

    expect(await listarSets()).toEqual([]);
  });

  // Por ejemplo, borrado en otra pestaña mientras este seguía abierto.
  it('un set que ya no existe da "No se encontró el set." al abrirlo, editarlo o borrarlo', async () => {
    await entrarComo('ana');
    const id = await crearSet({ nombre: 'Borrado', frases: frasesValidas() });
    await eliminarSet(id);

    await expect(obtenerSet(id)).rejects.toThrow('No se encontró el set.');
    await expect(actualizarSet(id, { nombre: 'X', frases: frasesValidas() })).rejects.toThrow('No se encontró el set.');
    await expect(eliminarSet(id)).rejects.toThrow('No se encontró el set.');
  });
});

describe('sets.js — cada docente ve solo sus sets', () => {
  it('otro docente no los lista ni puede abrirlos, editarlos o borrarlos', async () => {
    await entrarComo('ana');
    const id = await crearSet({ nombre: 'De Ana', frases: frasesValidas() });

    await entrarComo('beto');
    expect(await listarSets()).toEqual([]);
    await expect(obtenerSet(id)).rejects.toThrow('No tienes permiso para acceder a este set.');
    await expect(actualizarSet(id, { nombre: 'Robado', frases: frasesValidas() })).rejects.toThrow(
      'No tienes permiso para acceder a este set.',
    );
    await expect(eliminarSet(id)).rejects.toThrow('No tienes permiso para acceder a este set.');

    await entrarComo('ana');
    expect((await obtenerSet(id)).nombre).toBe('De Ana');
  });

  it('sin sesión no se puede listar ni crear', async () => {
    await salir();
    await expect(listarSets()).rejects.toThrow('No hay una sesión activa.');
    await expect(crearSet({ nombre: 'X', frases: frasesValidas() })).rejects.toThrow('No hay una sesión activa.');
  });
});
