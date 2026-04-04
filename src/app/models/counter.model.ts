export const COUNTER_CATEGORIES = ['Benjamín', 'Alevín', 'Infantil', 'Cadete', 'Juvenil', 'Junior', 'Senior'] as const;
export type CounterCategory = typeof COUNTER_CATEGORIES[number];

export interface PointEvent {
  side: 'left' | 'right';
  minute: number; // minutos enteros desde el inicio del partido (descontando pausas)
}

export interface CounterGame {
  id: string; // uuid
  title: string; // Ej: "Set 1", "Juego 2", etc.
  leftValue: number; // puntos del equipo local
  rightValue: number; // puntos del equipo visitante
  createdAt: string; // fecha de creación
  updatedAt: string; // fecha de última actualización
  points?: PointEvent[]; // timeline de puntos marcados
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
  category?: CounterCategory;      // Categoría: Benjamín, Alevín, Infantil, Cadete, Junior, Senior
  peakViewers?: number;            // Máximo de espectadores simultáneos registrado
  rotationLeft?: RotationState;    // Estado de rotación del equipo local
  rotationRight?: RotationState;   // Estado de rotación del equipo visitante
}

/**
 * Posiciones 1-6 del campo de voleibol.
 * Índice 0 = zona 1 (saque/derecha atrás), ..., índice 5 = zona 6 (centro atrás).
 * Rotación horaria: zona 2 → 1 → 6 → 5 → 4 → 3 → 2
 */
export interface RotationState {
  enabled: boolean;
  /** Dorsal de la jugadora en cada zona. positions[0] = zona 1 … positions[5] = zona 6 */
  positions: string[];
  /** Si el equipo juega con líbero */
  hasLibero?: boolean;
  /** Dorsal del líbero */
  liberoNumber?: string;
  /**
   * Dorsal de la jugadora a la que el líbero sigue (normalmente la central).
   * Cuando esa jugadora está en zonas 1/5/6, el líbero la reemplaza.
   * Cuando está en zonas 2/3/4, la titular vuelve.
   */
  liberoReplaces?: string;
}

export interface WhatsappConfig {
  groupChatId: string;            // ID del chat/grupo de WhatsApp (ej: 34612345678-123456789@g.us)
  groupName: string;              // Nombre visible del grupo (solo para mostrar)
  mode: 'onChange' | 'interval' | 'keyMoments'; // Enviar al cambiar, cada X min, o en momentos clave
  intervalMinutes: number;        // Minutos entre envíos (usado si mode === 'interval')
}

export interface CounterRecordList {
  id: string; // uuid
  ownerId: string; // user id
  title: string; // nombre del contador
  type: string; // tipo de contador
  leftValue: number; // puntos del equipo local
  rightValue: number; // puntos del equipo visitante
  leftSetsWon?: number;
  rightSetsWon?: number;
  leftName: string; // nombre del equipo
  rightName: string; // nombre del equipo
  currentGameId?: string; // ID del juego actualmente activo
  createdAt: string; // fecha de creación
  updatedAt: string; // fecha de última actualización
  deleted?: boolean; // Marcador eliminado lógicamente
  isFinished?: boolean; // indica si el partido está finalizado
  isPublic: boolean; // indica si el marcador es público
  category?: CounterCategory;
  matchStartedAt?: string;
  matchFinishedAt?: string;
  matchPausedMs?: number;
}

/**
 * Submodelo para representar a los usuarios autorizados a editar o ver un marcador.
 */
export interface AuthorizedUser {
  userId: string; // ID del usuario en Firestore (igual que el campo id en user.model.ts)
  email: string;  // Email del usuario (para mostrar y validar existencia)
  permission: 'L' | 'E'; // 'L' = Lectura, 'E' = Edición
}