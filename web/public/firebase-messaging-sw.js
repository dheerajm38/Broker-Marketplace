self.importScripts(
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"
);
self.importScripts(
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js"
);

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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        "[firebase-messaging-sw.js] Received background message:",
        payload
    );

    const notificationTitle = payload.notification?.title || "Notification";
    const notificationOptions = {
        body: payload.notification?.body || "",
        icon: payload.notification?.image || "/icon.png",
    };
    console.log(self.registration.showNotification);
    // self.registration.showNotification(notificationTitle, notificationOptions);
});
