// src/screens/ChatListScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const ChatListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(list);
        setLoading(false);
      },
      err => {
        console.log('Error loading chats: ', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const renderItem = ({ item }) => {
    const otherPerson = item.participantsData?.find(p => p.uid !== user.uid);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('Chat', {
            chatId: item.id,
            chatData: item,
          })
        }
      >
        <Text style={styles.userName}>{otherPerson?.email || 'مستخدم'}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'ابدأ المحادثة'}
        </Text>
        <Text style={styles.time}>{item.updatedAtText || ''}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>جاري تحميل المحادثات...</Text>
      </View>
    );
  }

  if (!chats.length) {
    return (
      <View style={styles.center}>
        <Text>لا توجد محادثات بعد.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 12 }}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  lastMessage: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: '#999',
    marginTop: 3,
  },
});

export default ChatListScreen;
