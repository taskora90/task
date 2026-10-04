<!-- Firebase SDKs -->
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
  import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyBITIN70jLaM8XCXhCjYKbg2uhdG6yFOS4",
    authDomain: "taskora-b2b29.firebaseapp.com",
    projectId: "taskora-b2b29",
    storageBucket: "taskora-b2b29.firebasestorage.app",
    messagingSenderId: "376297360134",
    appId: "1:376297360134:web:ba6ab17055df42a8e36c87",
    measurementId: "G-9803M7DPM5"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
</script>
