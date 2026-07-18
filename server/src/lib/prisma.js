import { PrismaClient } from '@prisma/client';

// Instancia única de PrismaClient para toda la app.
// Evita agotar el pool de conexiones en desarrollo con hot-reload.
const prisma = new PrismaClient();

export default prisma;
