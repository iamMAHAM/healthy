import { db, storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  where,
  query,
  deleteDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

/**********CONST VARIABLES********************/
export const auth = getAuth();

/*************FUNCTIONS*********************/
export const getOne = async (collect = '', id = '', callback = null) => {
  const docRef = doc(db, collect, id);
  const docSnap = await getDoc(docRef);
  let toPush = docSnap.data();
  toPush.id = docSnap.id;
  return callback(toPush);
};

export const getAll = async (collect, callback, origin = '') => {
  let result = [];
  const querySnapshot = await getDocs(collection(db, collect));
  querySnapshot.forEach((doc) => {
    let toPush = doc.data();
    toPush.id = doc.id;
    origin ? (toPush.origin = origin) : '';
    result.push(toPush);
  });
  return callback(result);
};

export const matchFields = async (categories = [], value = '', callback) => {
  let result = [];
  for (const cat of categories) {
    const q = query(
      collection(db, `data/Ho21xA8W3774097vSXhU/${cat}`),
      where('title', '>=', value),
      where('title', '<=', value + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.map((doc) => {
      let toPush = doc.data();
      toPush.id = doc.id;
      toPush.origin = cat;
      result.push(toPush);
    });
  }
  return callback(result);
};

export const saveDoc = async (collect = '', doct) => {
  const q = await addDoc(collection(db, collect), doct);
  if (!doct.hasOwnProperty('id')) {
    await updateDoc(doc(db, 'users', q.id), { id: q.id });
  }
};

export const saveOrOverride = async (collect, id, doct, callback) => {
  const docRef = await setDoc(doc(db, collect, id), doct);
  return callback();
};

export const saveDocs = (collect = '', docs = []) => {
  // Add a new document with a generated id.
  docs.forEach(async (doc) => {
    const docRef = await addDoc(collection(db, collect), doc);
  });
};

export const unSaveDoc = async (collect = '', doct) => {
  await deleteDoc(doc(db, collect, doct));
};

export const updateUserInfo = async (user_id, new_data) => {
  await updateDoc(doc(db, 'users', user_id), new_data);
};

export const signUp = (data, callback) => {
  let result = {
    status: null,
    message: null,
  };
  createUserWithEmailAndPassword(auth, data.email, data.password)
    .then(async (u) => {
      await sendEmailVerification(u.user);
      await saveDoc('users', data);
      result.status = true;
      result.message = 'register success';
      return callback(result);
    })
    .catch((e) => {
      (result.status = false), (result.message = e.code);
      return callback(result);
    });
};

export const signIn = async (data, callback) => {
  let result = {
    user: null,
    error: null,
  };
  signInWithEmailAndPassword(auth, data.email, data.password)
    .then(async (user) => {
      if (user.user.emailVerified) {
        const users = collection(db, 'users');
        const q = query(
          users,
          where('email', '==', data.email),
          where('password', '==', data.password)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          if (!doc.exists()) {
            console.log('not exist');
            return callback(result);
          }
          let user = doc.data();
          user['id'] = doc.id;
          result.user = user;
        });
      } else {
        //not confirm mail
        result.error = 'confirm email first';
      }
      return callback(result);
    })
    .catch((err) => {
      result.error = err.code;
      return callback(result);
    });
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const isLoggedUser = async (callback) => {
  onAuthStateChanged(auth, (user) => {
    const status = user ? true : false;
    return callback(status, user);
  });
};

export const sendMessage = async (id, message) => {
  await saveDoc(`chat/${id}/messages`, message);
  await saveDoc(`chat/8F1bKGaOUOAZGV0blD74/messages`, message);
};

export const uploadImage = async (path, file, callback) => {
  const Imagesref = ref(storage, path);
  await uploadBytes(Imagesref, file).then((snapshot) => {
    getDownloadURL(snapshot.ref).then((url) => {
      return callback(url);
    });
  });
};
export const allCategories = [
  'health',
  'home',
  'medicalMaterials',
  'slimmingSport',
  'veterinary',
  'beautyHygiene',
  'babyPregnancy',
  'drugs',
];
