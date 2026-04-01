import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CounterRecord, WhatsappConfig } from '../models/counter.model';

const GREEN_API_BASE = 'https://api.green-api.com';

export interface GreenApiChat {
  id: string;
  name: string;
  type: 'group' | 'chat';
}

@Injectable({ providedIn: 'root' })
export class WhatsappService {

  private sendingInterval?: ReturnType<typeof setInterval>;
  private lastSentMessage = '';
  private lastSentAt = 0;

  constructor(private http: HttpClient) {}

  // ─── Credenciales ────────────────────────────────────────────────────────────

  /** Llama a Green API y devuelve los chats/grupos disponibles de la instancia */
  async getChats(instanceId: string, token: string): Promise<GreenApiChat[]> {
    const url = `${GREEN_API_BASE}/waInstance${instanceId}/getChats/${token}`;
    const raw = await firstValueFrom(this.http.get<any[]>(url));
    return (raw || [])
      .filter(c => c.type === 'group' || c.type === 'chat')
      .map(c => ({ id: c.id, name: c.name || c.id, type: c.type }))
      .sort((a, b) => (a.type === 'group' ? -1 : 1));  // grupos primero
  }

  /** Envía un mensaje a un chat/grupo */
  async sendMessage(instanceId: string, token: string, chatId: string, message: string): Promise<void> {
    const url = `${GREEN_API_BASE}/waInstance${instanceId}/sendMessage/${token}`;
    await firstValueFrom(this.http.post(url, { chatId, message }));
    this.lastSentMessage = message;
    this.lastSentAt = Date.now();
  }

  // ─── Gestión del envío automático ────────────────────────────────────────────

  /** Arranca el envío automático según la config del contador */
  start(
    config: WhatsappConfig,
    instanceId: string,
    token: string,
    buildMessage: () => string
  ): void {
    this.stop();

    if (config.mode === 'interval') {
      const ms = (config.intervalMinutes || 5) * 60_000;
      this.sendingInterval = setInterval(async () => {
        const msg = buildMessage();
        await this.sendMessage(instanceId, token, config.groupChatId, msg).catch(console.error);
      }, ms);

      // Envío inmediato al activar
      const msg = buildMessage();
      this.sendMessage(instanceId, token, config.groupChatId, msg).catch(console.error);

    } else {
      // mode === 'onChange': el llamador invoca triggerOnChange() en cada punto
    }
  }

  /** Llama esto en cada cambio de marcador (usado en modo onChange) */
  async triggerOnChange(
    config: WhatsappConfig,
    instanceId: string,
    token: string,
    message: string
  ): Promise<void> {
    if (config.mode !== 'onChange') return;
    if (message === this.lastSentMessage) return;
    // Anti-spam: mínimo 5 segundos entre mensajes
    if (Date.now() - this.lastSentAt < 5_000) return;
    await this.sendMessage(instanceId, token, config.groupChatId, message).catch(console.error);
  }

  /** Para el envío automático */
  stop(): void {
    if (this.sendingInterval) {
      clearInterval(this.sendingInterval);
      this.sendingInterval = undefined;
    }
    this.lastSentMessage = '';
  }

  get isRunning(): boolean {
    return !!this.sendingInterval;
  }

  // ─── Formateo del mensaje ─────────────────────────────────────────────────────

  buildMessage(record: CounterRecord): string {
    const game = record.games.find(g => g.id === record.currentGameId);
    if (!game) return '';

    const leftWins  = record.games.filter(g => g.id !== record.currentGameId && g.leftValue  > g.rightValue).length;
    const rightWins = record.games.filter(g => g.id !== record.currentGameId && g.rightValue > g.leftValue).length;

    const leftDots  = '●'.repeat(leftWins)  || '–';
    const rightDots = '●'.repeat(rightWins) || '–';

    const lines = [
      `🏐 *${record.title}*`,
      `📊 *${game.title}*: ${record.leftName} *${game.leftValue}* – *${game.rightValue}* ${record.rightName}`,
    ];

    if (record.games.length > 1) {
      lines.push(`🏆 Sets: ${record.leftName} ${leftDots}  |  ${rightDots} ${record.rightName}`);
    }

    lines.push(`🔗 https://peropijocounter.web.app?id=${record.id}`);

    return lines.join('\n');
  }
}
