import { apiBaseUrl } from './api-base';

/** Empty in production. The member app's nginx proxies /api on this host. */
export const API_BASE_URL = apiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD);
