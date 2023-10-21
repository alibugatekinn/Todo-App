const admin = require('firebase-admin');

// Firebase konfigürasyon bilgilerinizi buraya ekleyin
const serviceAccount = require('../src/bugasoft-app-firebase-adminsdk-1q5w3-619a0f419d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function deleteDocumentAndSubcollections(documentRef) {
  const collections = await documentRef.listCollections();
  const promises = [];

  for (const collection of collections) {
    const snapshot = await collection.get();
    for (const doc of snapshot.docs) {
      promises.push(deleteDocumentAndSubcollections(doc.ref));
    }
  }

  const docSnapshot = await documentRef.get();
  docSnapshot.data() && Object.keys(docSnapshot.data()).forEach(field => {
    promises.push(documentRef.update({ [field]: admin.firestore.FieldValue.delete() }));
  });

  promises.push(documentRef.delete());

  return Promise.all(promises);
}

const email = 'aliba7134@gmail.com';
firestore.collection('users').where('email', '==', email).get().then(snapshot => {
  snapshot.forEach(doc => {
    deleteDocumentAndSubcollections(doc.ref).then(() => {
      console.log(`Document with email ${email} and all its subcollections and fields have been deleted.`);
    });
  });
}).catch(error => {
  console.error("Error deleting user: ", error);
});
