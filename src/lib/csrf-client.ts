/**
 * Helper para obtener y usar tokens CSRF en el frontend (Admin Dashboard)
 */

let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

/**
 * Obtiene el token CSRF del servidor
 * Cachea el token para evitar múltiples requests
 */
export async function getCSRFToken(): Promise<string> {
  // Si ya tenemos el token en cache, retornarlo
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  // Si ya hay una request en progreso, esperar a que termine
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Hacer request para obtener el token
  csrfTokenPromise = fetch('/api/csrf-token', {
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Error al obtener token CSRF');
      }
      const data = await response.json();
      csrfTokenCache = data.csrfToken;
      return data.csrfToken;
    })
    .catch((error) => {
      csrfTokenPromise = null;
      throw error;
    });

  return csrfTokenPromise;
}

/**
 * Invalida el cache del token CSRF
 * Útil cuando se necesita obtener un nuevo token
 */
export function clearCSRFTokenCache(): void {
  csrfTokenCache = null;
  csrfTokenPromise = null;
}

/**
 * Helper para hacer requests POST/PUT/DELETE con token CSRF automático
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCSRFToken();

  // Agregar token CSRF a headers
  const headers = new Headers(options.headers);
  headers.set('x-csrf-token', token);

  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? 'include',
  });
}

/**
 * Helper para hacer requests con formData y token CSRF
 */
export async function fetchFormDataWithCSRF(
  url: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCSRFToken();

  // Agregar token CSRF al formData
  formData.append('csrfToken', token);

  return fetch(url, {
    ...options,
    method: options.method || 'POST',
    body: formData,
    credentials: options.credentials ?? 'include',
  });
}

