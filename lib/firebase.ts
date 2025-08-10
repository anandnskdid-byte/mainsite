import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyC35qfMbaWyM1lr9ehE9QxuF2y3kcmpChA",
  authDomain: "db-shrikarni.firebaseapp.com",
  projectId: "db-shrikarni",
  storageBucket: "db-shrikarni.firebasestorage.app",
  messagingSenderId: "1044612421585",
  appId: "1:1044612421585:web:f6147f4c0fcdc46098b2f0",
  measurementId: "G-5N3TMGBPTP"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)
export const storage = getStorage(app)
export default app
