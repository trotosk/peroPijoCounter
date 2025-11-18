export interface CounterGame {
  id: string; // uuid
  title: string; // Ej: "Set 1", "Juego 2", etc.
  leftValue: number; // puntos del equipo local
  rightValue: number; // puntos del equipo visitante
  createdAt: string; // fecha de creación
  updatedAt: string; // fecha de última actualización
}

export interface CounterRecord {
  id: string; // uuid
  ownerId: string; // user id
  title: string; // nombre del contador
  type: string; // tipo de contador
  games: CounterGame[]; //Lista de juegos asociados
  leftName: string; // nombre del equipo
  rightName: string; // nombre del equipo
  currentGameId?: string; // ID del juego actualmente activo
  createdAt: string; // fecha de creación
  updatedAt: string; // fecha de última actualización
  /**
   * Lista de usuarios autorizados para colaborar.
   * Puede ser un array vacío si no hay ninguno.
   */
  authorizedUsers?: AuthorizedUser[];
  authorizedUserIds?: string[]; // Lista de IDs de usuarios autorizados para facilitar consultas
}

export interface CounterRecordList {
  id: string; // uuid
  ownerId: string; // user id
  title: string; // nombre del contador
  type: string; // tipo de contador
  leftValue: number; // puntos del equipo local
  rightValue: number; // puntos del equipo visitante
  leftName: string; // nombre del equipo
  rightName: string; // nombre del equipo
  currentGameId?: string; // ID del juego actualmente activo
  createdAt: string; // fecha de creación
  updatedAt: string; // fecha de última actualización
}

/**
 * Submodelo para representar a los usuarios autorizados a editar o ver un marcador.
 */
export interface AuthorizedUser {
  userId: string; // ID del usuario en Firestore (igual que el campo id en user.model.ts)
  email: string;  // Email del usuario (para mostrar y validar existencia)
  permission: 'L' | 'E'; // 'L' = Lectura, 'E' = Edición
}