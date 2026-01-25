import firestore from '@react-native-firebase/firestore';

export const testGigIndexes = async () => {
  try {
    console.log('Testing gig indexes...');
    
    // Test Index 1.1: Active Gigs by Quality Score
    const snapshot = await firestore()
      .collection('gigs')
      .where('status', '==', 'active')
      .orderBy('qualityScore', 'desc')
      .limit(10)
      .get();
    
    console.log(`✅ Index 1.1 working: Found ${snapshot.size} gigs`);
    
    // Log the gig titles to verify
    snapshot.forEach(doc => {
      console.log(`  - ${doc.data().title} (score: ${doc.data().qualityScore})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Index test failed:', error.message);
    return false;
  }
};

// Test Index 2.1: User Applications
export const testApplicationIndexes = async (userId) => {
  try {
    const snapshot = await firestore()
      .collection('applications')
      .where('applicantId', '==', userId)
      .orderBy('appliedAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`✅ Index 2.1 working: Found ${snapshot.size} applications`);
    return true;
  } catch (error) {
    console.error('❌ Application index test failed:', error.message);
    return false;
  }
};

// Test Index 3.1: User Portfolio
export const testPortfolioIndexes = async (userId) => {
  try {
    const snapshot = await firestore()
      .collection('portfolioItems')
      .where('userId', '==', userId)
      .where('isPublic', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`✅ Index 3.1 working: Found ${snapshot.size} portfolio items`);
    return true;
  } catch (error) {
    console.error('❌ Portfolio index test failed:', error.message);
    return false;
  }
};

// Test Index 4.1: User Conversations
export const testConversationIndexes = async (userId) => {
  try {
    const snapshot = await firestore()
      .collection('conversations')
      .where('participantIds', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`✅ Index 4.1 working: Found ${snapshot.size} conversations`);
    return true;
  } catch (error) {
    console.error('❌ Conversation index test failed:', error.message);
    return false;
  }
};

// Test Index 5.1: Conversation Messages
export const testMessageIndexes = async (conversationId) => {
  try {
    const snapshot = await firestore()
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .limit(50)
      .get();
    
    console.log(`✅ Index 5.1 working: Found ${snapshot.size} messages`);
    return true;
  } catch (error) {
    console.error('❌ Message index test failed:', error.message);
    return false;
  }
};

// Run all tests
export const testAllIndexes = async (userId, conversationId) => {
  console.log('========================================');
  console.log('🔍 Testing Firestore Compound Indexes');
  console.log('========================================');
  
  await testGigIndexes();
  await testApplicationIndexes(userId);
  await testPortfolioIndexes(userId);
  await testConversationIndexes(userId);
  
  if (conversationId) {
    await testMessageIndexes(conversationId);
  }
  
  console.log('========================================');
  console.log('✅ All index tests complete!');
  console.log('========================================');
};
