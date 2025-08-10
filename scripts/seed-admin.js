// Run this script to create the admin user
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getDatabase, ref, set } from 'firebase/database'

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
const auth = getAuth(app)
const database = getDatabase(app)

async function createAdminUser() {
  try {
    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@shrikarni.com', 
      'adminP@ssw0rd3146'
    )
    
    const user = userCredential.user
    
    // Save admin data to database
    await set(ref(database, `users/${user.uid}`), {
      role: 'admin',
      username: 'admin',
      name: 'Admin User',
      email: 'admin@shrikarni.com',
      createdAt: Date.now()
    })
    
    console.log('Admin user created successfully!')
    console.log('Email: admin@shrikarni.com')
    console.log('Password: adminP@ssw0rd3146')
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists!')
      console.log('Email: admin@shrikarni.com')
      console.log('Password: adminP@ssw0rd3146')
    } else {
      console.error('Error creating admin user:', error)
    }
  }
}

createAdminUser()
