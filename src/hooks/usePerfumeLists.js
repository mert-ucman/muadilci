import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function usePerfumeLists(userId) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLists([]); setLoading(false); return; }
    const q = query(collection(db, 'users', userId, 'perfumeLists'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [userId]);

  const createList = (data) =>
    addDoc(collection(db, 'users', userId, 'perfumeLists'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  const updateList = (listId, data) =>
    updateDoc(doc(db, 'users', userId, 'perfumeLists', listId), {
      ...data,
      updatedAt: serverTimestamp(),
    });

  const deleteList = (listId) =>
    deleteDoc(doc(db, 'users', userId, 'perfumeLists', listId));

  return { lists, loading, createList, updateList, deleteList };
}
