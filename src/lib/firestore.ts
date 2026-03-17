import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import app from './firebase';

export const db = getFirestore(app);

// Collection references
export const usersCollection = collection(db, 'users');
export const transactionsCollection = collection(db, 'transactions');

// User wallet operations
export async function getUserWallet(userId: string) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
}

export async function createUserWallet(userId: string, data: {
  email: string;
  displayName: string;
  phoneNumber: string;
  balance: number;
}) {
  await setDoc(doc(db, 'users', userId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserBalance(userId: string, amount: number) {
  await updateDoc(doc(db, 'users', userId), {
    balance: increment(amount),
    updatedAt: serverTimestamp(),
  });
}

// User data type
interface UserData {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  balance: number;
}

// Find user by phone number
export async function findUserByPhone(phoneNumber: string): Promise<UserData | null> {
  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
  const q = query(usersCollection, where('phoneNumber', '==', cleanPhone));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    return { 
      id: doc.id, 
      email: data.email || '',
      displayName: data.displayName || 'User',
      phoneNumber: data.phoneNumber || '',
      balance: data.balance || 0,
    };
  }
  return null;
}

// Transaction operations
export async function createTransaction(data: {
  senderId: string;
  senderName: string;
  senderPhone: string;
  receiverId: string;
  receiverName: string;
  receiverPhone: string;
  amount: number;
  type: 'p2p_send' | 'p2p_receive' | 'demo_transfer' | 'credit';
  status: 'success' | 'failed' | 'pending';
  description: string;
}) {
  const docRef = await addDoc(transactionsCollection, {
    ...data,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserTransactions(userId: string, limitCount: number = 50) {
  // IMPORTANT:
  // We intentionally avoid composite queries that require manual Firestore indexes
  // (e.g. where(...) + orderBy(...)). We fetch and sort client-side instead.
  const sentQuery = query(
    transactionsCollection,
    where('senderId', '==', userId),
    limit(limitCount)
  );

  const receivedQuery = query(
    transactionsCollection,
    where('receiverId', '==', userId),
    limit(limitCount)
  );
  
  const [sentSnapshot, receivedSnapshot] = await Promise.all([
    getDocs(sentQuery),
    getDocs(receivedQuery)
  ]);
  
  const transactions: any[] = [];
  
  sentSnapshot.forEach(doc => {
    transactions.push({ id: doc.id, ...doc.data() });
  });
  
  receivedSnapshot.forEach(doc => {
    transactions.push({ id: doc.id, ...doc.data() });
  });
  
  // Sort by timestamp and remove duplicates
  return transactions
    .sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, limitCount);
}

// Real-time listener for wallet balance
export function subscribeToWallet(userId: string, callback: (data: any) => void) {
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
}

// Real-time listener for transactions
export function subscribeToTransactions(userId: string, callback: (transactions: any[]) => void) {
  // Watch for changes affecting the user without needing composite indexes.
  // We keep it simple: subscribe to sent txns, and on any change refresh full list.
  const q = query(transactionsCollection, where('senderId', '==', userId), limit(20));

  return onSnapshot(q, async () => {
    const transactions = await getUserTransactions(userId, 20);
    callback(transactions);
  });
}

// Real-time listener for incoming P2P payments
export function subscribeToIncomingPayments(
  userId: string, 
  callback: (transaction: any) => void
) {
  // Avoid composite index requirement.
  const q = query(
    transactionsCollection,
    where('receiverId', '==', userId),
    where('type', '==', 'p2p_receive'),
    limit(5)
  );
  
  let isFirstSnapshot = true;
  
  return onSnapshot(q, (snapshot) => {
    // Skip the first snapshot (existing data)
    if (isFirstSnapshot) {
      isFirstSnapshot = false;
      return;
    }
    
    // Sort the new docs and emit the newest one.
    const newest = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.timestamp?.toMillis?.() || 0;
        const bTime = b.timestamp?.toMillis?.() || 0;
        return bTime - aTime;
      })[0];

    if (newest) {
      callback({
        ...newest,
        timestamp: (newest as any).timestamp?.toDate?.() || new Date(),
      });
    }
  });
}

// P2P Transfer - atomic operation
export async function executeP2PTransfer(
  senderId: string,
  senderData: { name: string; phone: string },
  receiverId: string,
  receiverData: { name: string; phone: string },
  amount: number
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Check sender balance
    const senderWallet = await getUserWallet(senderId);
    if (!senderWallet || senderWallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    // Deduct from sender
    await updateUserBalance(senderId, -amount);
    
    // Add to receiver
    await updateUserBalance(receiverId, amount);
    
    // Create transaction record for sender
    const transactionId = await createTransaction({
      senderId,
      senderName: senderData.name,
      senderPhone: senderData.phone,
      receiverId,
      receiverName: receiverData.name,
      receiverPhone: receiverData.phone,
      amount,
      type: 'p2p_send',
      status: 'success',
      description: `Sent to ${receiverData.name}`,
    });
    
    // Create transaction record for receiver
    await createTransaction({
      senderId,
      senderName: senderData.name,
      senderPhone: senderData.phone,
      receiverId,
      receiverName: receiverData.name,
      receiverPhone: receiverData.phone,
      amount,
      type: 'p2p_receive',
      status: 'success',
      description: `Received from ${senderData.name}`,
    });
    
    return { success: true, transactionId };
  } catch (error: any) {
    console.error('P2P Transfer error:', error);
    return { success: false, error: error.message };
  }
}
