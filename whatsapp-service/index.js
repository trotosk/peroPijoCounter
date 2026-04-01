const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
require('dotenv').config();

// ─── Configuración ───────────────────────────────────────────────────────────

const COUNTER_ID     = process.env.COUNTER_ID;
const GROUP_NAME     = process.env.GROUP_NAME;
const MIN_INTERVAL_MS = parseInt(process.env.MIN_INTERVAL_MS || '30000'); // mínimo 30s entre mensajes

if (!COUNTER_ID || !GROUP_NAME) {
  console.error('❌ Configura COUNTER_ID y GROUP_NAME en el archivo .env');
  process.exit(1);
}

// ─── Firebase Admin ──────────────────────────────────────────────────────────

let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch {
  console.error('❌ No se encontró serviceAccountKey.json');
  console.error('   Descárgalo en Firebase Console → Configuración → Cuentas de servicio');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── WhatsApp Client ─────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
  console.log('\n📱 Escanea este QR con tu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ WhatsApp conectado');
  console.log(`📊 Marcador: ${COUNTER_ID}`);
  console.log(`💬 Grupo:    ${GROUP_NAME}`);
  console.log(`⏱  Intervalo mínimo: ${MIN_INTERVAL_MS / 1000}s\n`);
  startWatching();
});

client.on('auth_failure', () => {
  console.error('❌ Error de autenticación. Borra la carpeta .wwebjs_auth/ y vuelve a ejecutar.');
  process.exit(1);
});

client.on('disconnected', reason => {
  console.warn('⚠️  WhatsApp desconectado:', reason);
  process.exit(1);
});

client.initialize();

// ─── Lógica principal ─────────────────────────────────────────────────────────

let groupId   = null;
let lastMsg   = null;
let lastSentAt = 0;

/**
 * Construye el mensaje que se enviará al grupo.
 */
function buildMessage(counter) {
  const currentGame = counter.games?.find(g => g.id === counter.currentGameId);
  if (!currentGame) return null;

  const leftWins  = counter.games.filter(g => g.id !== counter.currentGameId && g.leftValue  > g.rightValue).length;
  const rightWins = counter.games.filter(g => g.id !== counter.currentGameId && g.rightValue > g.leftValue).length;

  const leftDots  = leftWins  > 0 ? '●'.repeat(leftWins)  : '–';
  const rightDots = rightWins > 0 ? '●'.repeat(rightWins) : '–';

  return (
    `🏐 *${counter.title}*\n` +
    `📊 *${currentGame.title}*: ${counter.leftName} *${currentGame.leftValue}* – *${currentGame.rightValue}* ${counter.rightName}\n` +
    `🏆 Sets: ${counter.leftName} ${leftDots}  |  ${rightDots} ${counter.rightName}\n` +
    `🔗 https://peropijocounter.web.app?id=${counter.id}`
  );
}

/**
 * Busca el ID del grupo por nombre. Lista los grupos disponibles si no lo encuentra.
 */
async function resolveGroupId() {
  const chats = await client.getChats();
  const group = chats.find(c => c.isGroup && c.name === GROUP_NAME);
  if (!group) {
    console.error(`❌ Grupo "${GROUP_NAME}" no encontrado.\n   Grupos disponibles:`);
    chats.filter(c => c.isGroup).forEach(c => console.log(`   - ${c.name}`));
    process.exit(1);
  }
  return group.id._serialized;
}

/**
 * Escucha cambios en Firestore y envía al grupo cuando el marcador cambia.
 */
function startWatching() {
  const ref = db.collection('counters').doc(COUNTER_ID);

  ref.onSnapshot(async snap => {
    if (!snap.exists) {
      console.error('❌ Marcador no encontrado en Firestore:', COUNTER_ID);
      return;
    }

    const counter = snap.data();
    const message = buildMessage(counter);
    if (!message) return;

    const now = Date.now();

    // No enviar si el mensaje es idéntico al anterior
    if (message === lastMsg) return;

    // No enviar si no ha pasado suficiente tiempo
    if (now - lastSentAt < MIN_INTERVAL_MS) return;

    try {
      if (!groupId) groupId = await resolveGroupId();
      await client.sendMessage(groupId, message);
      lastMsg    = message;
      lastSentAt = now;
      console.log(`✅ [${new Date().toLocaleTimeString()}] Enviado → ${counter.leftName} ${snap.data().games?.find(g => g.id === counter.currentGameId)?.leftValue} – ${snap.data().games?.find(g => g.id === counter.currentGameId)?.rightValue} ${counter.rightName}`);
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err.message);
    }
  }, err => {
    console.error('❌ Error en Firestore listener:', err.message);
  });
}
