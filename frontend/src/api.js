
/**
 * STB Computers
 * Configuración central de la API
 *
 * Desarrollo local: Django en puerto 8000
 * Producción: backend publicado en Render
 */

const API_LOCAL = 'http://127.0.0.1:8000';

const API_PRODUCCION =
  'https://computers-backend-bpk0.onrender.com';

// Vite utiliza DEV para identificar el entorno local.
export const API_URL = import.meta.env.DEV
  ? API_LOCAL
  : (import.meta.env.VITE_API_URL || API_PRODUCCION);
