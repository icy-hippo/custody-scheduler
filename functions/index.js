const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore();

async function getFamilyTokens(familyId, excludeUserId) {
  try {
    const familyDoc = await db.collection('families').doc(familyId).get();
    if (!familyDoc.exists) return [];

    const members = familyDoc.data().members || [];
    const tokens = [];

    for (const uid of members) {
      if (uid === excludeUserId) continue;
      const tokenDoc = await db.collection('fcmTokens').doc(uid).get();
      if (tokenDoc.exists && tokenDoc.data().token) {
        tokens.push(tokenDoc.data().token);
      }
    }
    return tokens;
  } catch (e) {
    console.error('Error getting family tokens:', e);
    return [];
  }
}

async function sendNotification(tokens, title, body) {
  if (!tokens.length) return;
  try {
    const message = {
      notification: { title, body },
      android: { notification: { icon: 'ic_stat_icon_config_sample', color: '#667EEA' } },
      tokens,
    };
    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`Sent ${response.successCount} notifications`);
  } catch (e) {
    console.error('Error sending notification:', e);
  }
}

exports.onEventCreated = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data.familyId || !data.createdBy) return;
    const tokens = await getFamilyTokens(data.familyId, data.createdBy);
    const dateStr = data.date || '';
    await sendNotification(
      tokens,
      `📅 New Event: ${data.title}`,
      `${dateStr}${data.time ? ' at ' + data.time : ''}${data.location ? ' • ' + data.location : ''}`
    );
  });

exports.onFamilyMessageCreated = functions.firestore
  .document('familyMessages/{msgId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data.familyId || !data.senderId) return;
    const tokens = await getFamilyTokens(data.familyId, data.senderId);
    await sendNotification(
      tokens,
      `💬 ${data.senderName || 'Someone'} sent a message`,
      data.text || ''
    );
  });

exports.onMessageCreated = functions.firestore
  .document('messages/{msgId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data.familyId || !data.senderId) return;
    const tokens = await getFamilyTokens(data.familyId, data.senderId);
    await sendNotification(
      tokens,
      `💬 ${data.senderName || 'Co-parent'} sent a message`,
      data.text || ''
    );
  });

exports.onHandoffNoteCreated = functions.firestore
  .document('handoffNotes/{noteId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data.familyId || !data.createdBy) return;
    const tokens = await getFamilyTokens(data.familyId, data.createdBy);
    await sendNotification(
      tokens,
      `📋 New Handoff Note from ${data.createdByName || 'Co-parent'}`,
      'Tap to view the handoff details'
    );
  });
