export interface User {
  id: string; // uuid
  email: string;
  name: string;
  password?: string; // según tu petición: sin restricciones, max 15 caracteres
  createdAt?: string;
  greenApiInstanceId?: string; // ID de instancia de Green API para envíos por WhatsApp
  greenApiToken?: string;      // Token de API de Green API
}
