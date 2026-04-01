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
  authorizedUsers?: AuthorizedUser[]; // Lista de usuarios autorizados a ver/editar el marcador
  authorizedUserIds?: string[]; // Lista de IDs de usuarios autorizados para facilitar consultas
  deleted?: boolean; // Marcador eliminado lógicamente
  isFinished?: boolean; // indica si el partido está finalizado
  isPublic: boolean; // indica si el marcador es público
  matchStartedAt?: string;  // ISO timestamp del primer punto marcado
  matchFinishedAt?: string; // ISO timestamp de cuando se finalizó el partido
  matchPausedMs?: number;   // ms acumulados en pausa (para soportar reanudar)
  whatsappConfig?: WhatsappConfig; // Configuración de envío automático por WhatsApp
}

export interface WhatsappConfig {
  groupChatId: string;            // ID del chat/grupo de WhatsApp (ej: 34612345678-123456789@g.us)
  groupName: string;              // Nombre visible del grupo (solo para mostrar)
  mode: 'onChange' | 'interval'; // Enviar al cambiar el marcador o cada X minutos
  intervalMinutes: number;        // Minutos entre envíos (usado si mode === 'interval')
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
  deleted?: boolean; // Marcador eliminado lógicamente
  isFinished?: boolean; // indica si el partido está finalizado
  isPublic: boolean; // indica si el marcador es público
}

/**
 * Submodelo para representar a los usuarios autorizados a editar o ver un marcador.
 */
export interface AuthorizedUser {
  userId: string; // ID del usuario en Firestore (igual que el campo id en user.model.ts)
  email: string;  // Email del usuario (para mostrar y validar existencia)
  permission: 'L' | 'E'; // 'L' = Lectura, 'E' = Edición
}