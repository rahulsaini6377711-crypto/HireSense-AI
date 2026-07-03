import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';
import {
  safeGetDocs,
  safeUpdateDoc,
  safeDeleteDoc,
  safeAddDoc
} from '../utils/firestoreHelper';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth() || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      const snapshot = await safeGetDocs(q);
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort client-side to avoid Firestore index errors
      list.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setNotifications(list);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  const addNotification = useCallback(async (title, message, type = 'info') => {
    const newNotification = {
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    };

    if (user?.uid) {
      try {
        const docRef = await safeAddDoc(collection(db, 'notifications'), {
          ...newNotification,
          userId: user.uid,
        });
        setNotifications(prev => [
          { id: docRef.id, ...newNotification, userId: user.uid },
          ...prev,
        ]);
      } catch (error) {
        console.error('Failed to save notification:', error);
      }
    } else {
      // Local fallback
      setNotifications(prev => [
        { id: Math.random().toString(), ...newNotification },
        ...prev,
      ]);
    }

    // Trigger toast notification
    if (type === 'success') {
      toast.success(`${title}: ${message}`);
    } else if (type === 'error') {
      toast.error(`${title}: ${message}`);
    } else {
      toast(message, { icon: '🔔' });
    }
  }, [user]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    if (user?.uid) {
      try {
        const notifRef = doc(db, 'notifications', id);
        await safeUpdateDoc(notifRef, { read: true });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    if (user?.uid && notifications.length > 0) {
      try {
        const batch = writeBatch(db);
        notifications.forEach(n => {
          if (!n.read) {
            const notifRef = doc(db, 'notifications', n.id);
            batch.update(notifRef, { read: true });
          }
        });
        await batch.commit();
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    }
  }, [user, notifications]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    if (user?.uid && notifications.length > 0) {
      try {
        const batch = writeBatch(db);
        notifications.forEach(n => {
          const notifRef = doc(db, 'notifications', n.id);
          batch.delete(notifRef);
        });
        await batch.commit();
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    }
  }, [user, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
