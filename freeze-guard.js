// freeze-guard.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function injectFreezeStyles() {
  if (document.getElementById("tk-freeze-guard-style")) return;

  const style = document.createElement("style");
  style.id = "tk-freeze-guard-style";
  style.textContent = `
    #tkFreezeOverlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: inherit;
    }
    .tk-freeze-modal {
      width: 100%;
      max-width: 400px;
      background: #ffffff;
      color: #111827;
      border-radius: 16px;
      padding: 24px 20px;
      text-align: center;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
    }
    .tk-freeze-icon {
      font-size: 38px;
      margin-bottom: 10px;
    }
    .tk-freeze-title {
      margin: 0 0 8px;
      font-size: 19px;
      font-weight: 700;
      color: #b91c1c;
    }
    .tk-freeze-desc {
      margin: 0 0 14px;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
    }
    .tk-freeze-reason {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 13px;
      margin-bottom: 16px;
      word-break: break-word;
    }
    .tk-freeze-note {
      font-size: 12px;
      color: #6b7280;
    }
  `;
  document.head.appendChild(style);
}

function showFreezeOverlay(reasonText) {
  injectFreezeStyles();

  const cleanReason = (reasonText || "").trim() || "অ্যাডমিন কর্তৃক অ্যাকাউন্ট সাময়িকভাবে ফ্রিজ করা হয়েছে।";
  let overlay = document.getElementById("tkFreezeOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "tkFreezeOverlay";
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="tk-freeze-modal">
      <div class="tk-freeze-icon">❄️</div>
      <h3 class="tk-freeze-title">অ্যাকাউন্ট ফ্রিজ করা হয়েছে</h3>
      <p class="tk-freeze-desc">
        আপনার অ্যাকাউন্টটি বর্তমানে ফ্রিজ অবস্থায় আছে। এই অবস্থায় কোনো কাজ বা লেনদেন করা যাবে না।
      </p>
      <div class="tk-freeze-reason">
        <strong>কারণ:</strong> ${cleanReason}
      </div>
      <div class="tk-freeze-note">
        বিস্তারিত জানতে সাপোর্ট বা অ্যাডমিনের সাথে যোগাযোগ করুন।
      </div>
    </div>
  `;

  window.__TK_ACCOUNT_FROZEN__ = true;
}

function hideFreezeOverlay() {
  const overlay = document.getElementById("tkFreezeOverlay");
  if (overlay) {
    overlay.remove();
  }
  window.__TK_ACCOUNT_FROZEN__ = false;
}

export function initFreezeGuard(appInstance = null) {
  const auth = appInstance ? getAuth(appInstance) : getAuth();
  const db = appInstance ? getFirestore(appInstance) : getFirestore();

  let unsubscribeUserDoc = null;

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeUserDoc) {
      unsubscribeUserDoc();
      unsubscribeUserDoc = null;
    }

    if (!user) {
      hideFreezeOverlay();
      return;
    }

    const userRef = doc(db, "users", user.uid);
    unsubscribeUserDoc = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          hideFreezeOverlay();
          return;
        }
        const data = snap.data() || {};
        if (data.isFrozen === true) {
          showFreezeOverlay(data.freezeReason);
        } else {
          hideFreezeOverlay();
        }
      },
      (err) => {
        console.error("Freeze guard listener error:", err);
      }
    );
  });
}

// ফাইলটি ইমপোর্ট করলেই স্বয়ংক্রিয়ভাবে চালু হবে
initFreezeGuard();
