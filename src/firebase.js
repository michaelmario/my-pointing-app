// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZQ1uTPADVuX2_2EK8HpFtUmTGVh-B6k0",
  authDomain: "afbk-e2fd8.firebaseapp.com",
  projectId: "afbk-e2fd8",
  storageBucket: "afbk-e2fd8.firebasestorage.app",
  messagingSenderId: "936627202916",
  appId: "1:936627202916:web:0c27bd2216bcf9b4166871",
  measurementId: "G-4N60HBPJ0X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Create Google Auth Provider
const googleProvider = new GoogleAuthProvider();
// Add custom parameters if needed
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export { auth, googleProvider };
export default { auth, db, storage };
