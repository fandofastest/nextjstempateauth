import 'dotenv/config';
import * as baileys from '@whiskeysockets/baileys';
import Pino from 'pino';
import path from 'path';
import fs from 'fs/promises';
import qrcode from 'qrcode-terminal';
// Node 18+: global fetch/FormData/Blob available
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const SERVICE_BEARER = process.env.SERVICE_BEARER || '';
const GROUP_IDS = (process.env.GROUP_IDS || '').split(',').map(s => s.trim()).filter(Boolean); // e.g. 1203630xxxxx@g.us
const INCLUDE_DMS = (process.env.INCLUDE_DMS || 'true').toLowerCase() === 'true';
const MAX_SIZE_MB = parseInt(process.env.MAX_SIZE_MB || '50');
const PROCESSED_STORE = process.env.PROCESSED_STORE || path.join(process.cwd(), 'scripts', 'wa-bot', 'data', 'processed.json');
const LOGIN_EMAIL = process.env.LOGIN_EMAIL || '';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || '';
const logger = Pino({ level: process.env.LOG_LEVEL || 'info' });
// Token management: keep a normalized bearer token in-memory
let currentToken = (SERVICE_BEARER || '').replace(/^Bearer\s+/i, '');
function getAuthHeader() {
    return currentToken ? `Bearer ${currentToken}` : '';
}
async function authSelfTest() {
    const url = `${BASE_URL.replace(/\/$/, '')}/api/auth/test`;
    const doReq = async () => fetch(url, {
        headers: { Authorization: getAuthHeader() }
    });
    let res = await doReq();
    if (res.status === 401) {
        logger.warn('auth test 401, trying to refresh token...');
        const ok = await refreshToken();
        if (ok)
            res = await doReq();
    }
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        logger.warn({ status: res.status, t }, 'auth test failed');
        return false;
    }
    const json = await res.json().catch(() => ({}));
    logger.info({ via: json?.via, user: json?.user }, 'auth test ok');
    return true;
}
async function refreshToken() {
    try {
        // 1) If we have a token, try to re-issue via POST /api/auth/token with Bearer
        if (currentToken) {
            const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/auth/token`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${currentToken}` }
            });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data?.token) {
                    currentToken = data.token;
                    logger.info('token refreshed via /api/auth/token');
                    return true;
                }
            }
        }
        // 2) Else, if credentials are provided, login to obtain a new token
        if (LOGIN_EMAIL && LOGIN_PASSWORD) {
            const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD })
            });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data?.token) {
                    currentToken = data.token;
                    logger.info('token obtained via /api/auth/login');
                    return true;
                }
            }
            else {
                const t = await res.text().catch(() => '');
                logger.warn({ status: res.status, t }, 'login failed while refreshing token');
            }
        }
    }
    catch (err) {
        logger.error(err, 'refreshToken error');
    }
    return false;
}
// Category mapping
function mapCategory(mime, fileName) {
    const lower = (mime || '').toLowerCase();
    const nameLower = (fileName || '').toLowerCase();
    if (lower.startsWith('image/'))
        return 'foto';
    if (lower.startsWith('video/'))
        return 'video';
    if (lower === 'application/pdf' || nameLower.endsWith('.pdf'))
        return 'surat';
    if (lower === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || nameLower.endsWith('.docx') || nameLower.endsWith('.doc'))
        return 'surat';
    return 'media';
}
async function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
}
async function loadProcessed() {
    try {
        const txt = await fs.readFile(PROCESSED_STORE, 'utf-8');
        return JSON.parse(txt);
    }
    catch {
        return {};
    }
}
async function saveProcessed(store) {
    await ensureDir(PROCESSED_STORE);
    await fs.writeFile(PROCESSED_STORE, JSON.stringify(store, null, 2), 'utf-8');
}
async function uploadToApi(opts) {
    const { buffer, fileName, mimeType, category, isPublic = false, description, phone, tags } = opts;
    const url = `${BASE_URL.replace(/\/$/, '')}/api/files`;
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    if (buffer.byteLength > maxBytes) {
        logger.warn({ fileName, size: buffer.byteLength }, `skip upload: file exceeds MAX_SIZE_MB=${MAX_SIZE_MB}`);
        return;
    }
    const fd = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType || 'application/octet-stream' });
    fd.append('file', blob, fileName);
    if (category)
        fd.append('category', category);
    fd.append('isPublic', isPublic ? 'true' : 'false');
    if (description && description.trim().length)
        fd.append('description', description.trim());
    if (phone && phone.trim().length)
        fd.append('phone', phone.trim());
    if (tags && tags.length > 0)
        fd.append('tags', JSON.stringify(tags));
    const doRequest = async () => fetch(url, {
        method: 'POST',
        headers: {
            Authorization: getAuthHeader()
        },
        body: fd
    });
    // First attempt
    let res = await doRequest();
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 401) {
            logger.warn({ status: res.status, text }, 'upload unauthorized, attempting token refresh');
            const refreshed = await refreshToken();
            if (refreshed) {
                // retry once with new token
                res = await doRequest();
            }
        }
        if (!res.ok) {
            const text2 = res.body ? (await res.text().catch(() => text)) : text;
            logger.error({ status: res.status, text: text2 }, 'upload failed');
            return null;
        }
    }
    const json = await res.json().catch(() => ({}));
    logger.info({ file: json?.file || {}, tags: tags || [] }, 'uploaded');
    return json?.file || null;
}
const makeWASocket = baileys.makeWASocket || baileys.default;
const { useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = baileys;
async function start() {
    await authSelfTest().catch(err => logger.warn(err, 'auth self-test error'));
    const { state, saveCreds } = await useMultiFileAuthState(path.join(process.cwd(), 'scripts', 'wa-bot', 'auth'));
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        auth: state,
        logger: logger
    });
    sock.ev.on('creds.update', saveCreds);
    let processed = await loadProcessed();
    sock.ev.on('connection.update', (update) => {
        if (update.qr) {
            // Render QR in terminal
            qrcode.generate(update.qr, { small: true });
            logger.info('Scan the QR code above to login WhatsApp');
        }
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.message || code;
            logger.warn({ reason }, 'connection closed, reconnecting...');
            start().catch(err => logger.error(err, 'reconnect error'));
        }
        else if (connection === 'open') {
            logger.info('whatsapp connected');
            (async () => {
                try {
                    const groups = await sock.groupFetchAllParticipating();
                    for (const [id, info] of Object.entries(groups || {})) {
                        logger.info({ id, subject: info?.subject }, 'Group found');
                    }
                }
                catch (e) {
                    logger.warn(e, 'Failed to fetch groups');
                }
            })();
        }
    });
    sock.ev.on('messages.upsert', async (m) => {
        try {
            logger.trace({ messageCount: m.messages.length }, 'Received messages batch');
            // Group messages by sender and timestamp for batch processing
            const mediaMessages = [];
            let sharedDescription = '';
            let sharedTags = [];
            for (const msg of m.messages) {
                const id = msg?.key?.id;
                if (!id || processed[id])
                    continue;
                const remoteJid = msg.key.remoteJid || '';
                const fromMe = !!msg.key.fromMe;
                const isGroup = remoteJid.endsWith('@g.us');
                logger.trace({
                    id, remoteJid, fromMe, isGroup,
                    messageType: Object.keys(msg.message || {})
                }, 'Processing message');
                if (fromMe) {
                    logger.trace('Skipping message from self');
                    processed[id] = true;
                    continue;
                }
                if (isGroup) {
                    logger.info({ groupJid: remoteJid }, 'Incoming message from group');
                    if (GROUP_IDS.length && !GROUP_IDS.includes(remoteJid)) {
                        logger.trace('Group not in allowed list, skipping');
                        continue;
                    }
                }
                else {
                    logger.info({ dmJid: remoteJid }, 'Incoming DM message');
                    if (!INCLUDE_DMS) {
                        logger.trace('DMs not enabled, skipping');
                        continue;
                    }
                }
                // detect media message kinds
                const content = msg.message || {};
                const hasMedia = !!(content.imageMessage || content.videoMessage || content.documentMessage || content.audioMessage || content.stickerMessage);
                logger.trace({
                    hasMedia,
                    contentKeys: Object.keys(content),
                    hasImage: !!content.imageMessage,
                    hasVideo: !!content.videoMessage,
                    hasDocument: !!content.documentMessage
                }, 'Media detection');
                if (!hasMedia) {
                    logger.trace('No media found in message, skipping');
                    processed[id] = true;
                    continue;
                }
                // Extract description and tags from any message that has caption/text
                if (!sharedDescription) {
                    let description = '';
                    if (content.imageMessage?.caption)
                        description = content.imageMessage.caption;
                    else if (content.videoMessage?.caption)
                        description = content.videoMessage.caption;
                    else if (content.documentMessage?.caption)
                        description = content.documentMessage.caption;
                    else if (content.conversation)
                        description = content.conversation;
                    else if (content.extendedTextMessage?.text)
                        description = content.extendedTextMessage.text;
                    if (description) {
                        // optional: trim overly long descriptions
                        if (description.length > 1000)
                            description = description.slice(0, 1000);
                        // Extract tags from description (look for #hashtags)
                        const hashtagRegex = /#(\w+)/g;
                        const matches = description.match(hashtagRegex);
                        if (matches) {
                            sharedTags = matches.map(tag => tag.slice(1)); // remove # symbol
                            // Remove hashtags from description to keep it clean
                            description = description.replace(hashtagRegex, '').trim();
                            logger.info({ tags: sharedTags, originalDescription: description }, 'extracted tags from batch');
                        }
                        sharedDescription = description;
                    }
                }
                mediaMessages.push({ msg, remoteJid, isGroup });
                logger.info({ remoteJid, hasMedia, batchSize: mediaMessages.length }, 'Added to media batch');
            }
            // Process all media messages in the batch
            if (mediaMessages.length > 0) {
                logger.info({ batchSize: mediaMessages.length, tags: sharedTags }, 'Processing media batch');
                for (const { msg, remoteJid, isGroup } of mediaMessages) {
                    const id = msg?.key?.id;
                    try {
                        const content = msg.message || {};
                        // download
                        const buffer = await downloadMediaMessage(msg, 'buffer', {});
                        // derive filename and mime
                        let fileName = 'wa-media';
                        let mimeType = 'application/octet-stream';
                        if (content.imageMessage) {
                            fileName = content.imageMessage?.fileName || `image-${Date.now()}.jpg`;
                            mimeType = content.imageMessage?.mimetype || 'image/jpeg';
                        }
                        else if (content.videoMessage) {
                            fileName = content.videoMessage?.fileName || `video-${Date.now()}.mp4`;
                            mimeType = content.videoMessage?.mimetype || 'video/mp4';
                        }
                        else if (content.documentMessage) {
                            fileName = content.documentMessage?.fileName || `document-${Date.now()}`;
                            mimeType = content.documentMessage?.mimetype || 'application/octet-stream';
                        }
                        else if (content.audioMessage) {
                            fileName = `audio-${Date.now()}.ogg`;
                            mimeType = content.audioMessage?.mimetype || 'audio/ogg';
                        }
                        else if (content.stickerMessage) {
                            fileName = `sticker-${Date.now()}.webp`;
                            mimeType = 'image/webp';
                        }
                        const category = mapCategory(mimeType, fileName);
                        // determine sender phone (group: participant; dm: remoteJid)
                        const senderJid = (msg.key?.participant) || remoteJid || '';
                        let phone = undefined;
                        if (senderJid) {
                            const num = String(senderJid).split('@')[0] || '';
                            const digits = num.replace(/\D/g, '');
                            if (digits.length >= 8 && digits.length <= 15) {
                                phone = `+${digits}`;
                            }
                        }
                        // Do not upload if we couldn't extract sender phone
                        if (!phone) {
                            logger.warn({ remoteJid }, 'skip upload: could not extract sender phone');
                            processed[id] = true;
                            continue;
                        }
                        const isPublic = !!isGroup;
                        const uploadResult = await uploadToApi({
                            buffer, fileName, mimeType, category, isPublic,
                            description: sharedDescription, phone, tags: sharedTags
                        });
                        // Store successful upload for batch reply
                        if (uploadResult) {
                            mediaMessages[mediaMessages.findIndex(m => m.msg.key.id === id)].uploadResult = uploadResult;
                        }
                        processed[id] = true;
                    }
                    catch (err) {
                        logger.error({ err, id }, 'Error processing individual media file');
                        processed[id] = true;
                    }
                }
                // Send auto-reply with upload summary
                if (mediaMessages.length > 0) {
                    await saveProcessed(processed);
                    // Count successful uploads
                    const successfulUploads = mediaMessages.filter(m => m.uploadResult).length;
                    const failedUploads = mediaMessages.length - successfulUploads;
                    if (successfulUploads > 0) {
                        const firstMsg = mediaMessages[0].msg;
                        const replyJid = firstMsg.key.remoteJid;
                        let replyText = `✅ *Upload Berhasil*\n\n`;
                        replyText += `📁 ${successfulUploads} file berhasil diupload\n`;
                        if (sharedDescription) {
                            replyText += `📝 Deskripsi: ${sharedDescription}\n`;
                        }
                        if (sharedTags.length > 0) {
                            replyText += `🏷️ Tags: ${sharedTags.map(t => `#${t}`).join(' ')}\n`;
                        }
                        if (failedUploads > 0) {
                            replyText += `\n⚠️ ${failedUploads} file gagal diupload`;
                        }
                        replyText += `\n\n📊 Akses file: ${BASE_URL}/user/files`;
                        try {
                            await sock.sendMessage(replyJid, { text: replyText });
                            logger.info({ replyJid, successfulUploads, failedUploads }, 'sent auto-reply');
                        }
                        catch (err) {
                            logger.error({ err, replyJid }, 'failed to send auto-reply');
                        }
                    }
                }
            }
        }
        catch (err) {
            logger.error(err, 'messages.upsert error');
        }
    });
}
start().catch(err => {
    logger.error(err, 'fatal error');
    process.exit(1);
});
