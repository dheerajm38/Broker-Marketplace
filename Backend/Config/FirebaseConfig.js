import admin from 'firebase-admin';
import serviceAccount from '../dhirajmitallapp-firebase-adminsdk-fbsvc-da5f8d0c60.json' assert { type: 'json' };  // You'll need to replace this with your actual path

// Initialize the app with your credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
