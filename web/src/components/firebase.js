// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken } from "firebase/messaging";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//     apiKey: "AIzaSyDW4YEv44CLtvxp4Xa8aqzA4US9JDnP3XA",
//     authDomain: "test-4aca0.firebaseapp.com",
//     projectId: "test-4aca0",
//     storageBucket: "test-4aca0.firebasestorage.app",
//     messagingSenderId: "531457879566",
//     appId: "1:531457879566:web:5b8a6338813816ade1d65f",
//     measurementId: "G-L9ZKSD0WHR",
// };

const firebaseConfig = {
    apiKey: "AIzaSyDEzdWNZZosH8X6aO_50a-4aiLZrGI2YYM",
    authDomain: "dhirajmitallapp.firebaseapp.com",
    projectId: "dhirajmitallapp",
    storageBucket: "dhirajmitallapp.firebasestorage.app",
    messagingSenderId: "982780813763",
    appId: "1:982780813763:web:e0536884a276588de01d76",
    measurementId: "G-B5N9KYN66H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

// getToken(messaging, {
//     vapidKey:
//         "BJTgXtvFXjqvFcmIzyPZ6AnMpygF1v6p1hAcI_sKCLiBI_rWSEDO4dl6LrDZDGtAMlzvCt6nNcR1yeZAWkP52Rs",
// });

export { messaging };
