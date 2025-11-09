import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';

// Add a notification to Firestore
export const createNotification = async (userId, title, message, type, data = {}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type, // 'event_created', 'event_updated', 'event_deleted', 'custody_transition', 'parent_linked'
      data,
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Get all unread notifications for a user
export const getUnreadNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, { read: true })
    );
    await Promise.all(promises);
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    console.error('Error deleting notification:', err);
  }
};

// Subscribe to real-time notifications
export const subscribeToNotifications = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      // Sort by newest first
      notifications.sort((a, b) => b.createdAt - a.createdAt);
      callback(notifications);
    });
    
    return unsubscribe;
  } catch (err) {
    console.error('Error subscribing to notifications:', err);
    return () => {};
  }
};