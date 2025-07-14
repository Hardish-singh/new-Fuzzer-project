
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {

  apiKey: "AIzaSyAa0dhXxs116-th0279f_QciHzQvXQ2QDM",
  authDomain: "b24venture-a457b.firebaseapp.com",
  projectId: "b24venture-a457b",
  storageBucket: "b24venture-a457b.firebasestorage.app",
  messagingSenderId: "700908139356",
  appId: "1:700908139356:web:2782d571445feb323b8799",
  measurementId: "G-C8RZ6PT612"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


export { auth, db };

