const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getConfiguredLoanDays() {
  try {
    const cfgSnap = await db.collection("admin_settings").doc("loan_config").get();
    if (cfgSnap.exists) {
      const cfgData = cfgSnap.data() || {};
      const parsedDays = parseInt(cfgData.durationDays, 10);
      if (!Number.isNaN(parsedDays) && parsedDays > 0) {
        return parsedDays;
      }
    }
  } catch (err) {
    console.warn("লোন কনফিগ থেকে মেয়াদ পড়া যায়নি, ডিফল্ট ১৫ দিন ব্যবহার করা হচ্ছে:", err.message || err);
  }
  return 15;
}

async function runAutoDeduct() {
  try {
    const loansRef = db.collection("loan_requests");
    const snapshot = await loansRef.where("status", "in", ["approved", "active"]).get();

    if (snapshot.empty) {
      console.log("কোনো সক্রিয় লোন পাওয়া যায়নি।");
      return;
    }

    const configuredDays = await getConfiguredLoanDays();

    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    for (const docSnap of snapshot.docs) {
      const loanData = docSnap.data();
      const userId = loanData.userId;
      const totalLoanAmount = Number(loanData.amount || 0);
      const dueAmount = Number(loanData.dueAmount !== undefined ? loanData.dueAmount : totalLoanAmount);

      if (dueAmount <= 0) continue;

      const rawLoanDays = (loanData.totalDays !== undefined && loanData.totalDays !== null)
        ? parseInt(loanData.totalDays, 10)
        : ((loanData.days !== undefined && loanData.days !== null) ? parseInt(loanData.days, 10) : NaN);
      const loanDays = (!Number.isNaN(rawLoanDays) && rawLoanDays > 0) ? rawLoanDays : configuredDays;

      // ১. পুরো লোনকে নির্ধারিত মেয়াদ (দিন) ভাগে ভাগ করে প্রতি দিনের বা প্রতি ভাগের টার্গেট হিসাব করা
      const dailyTarget = Math.ceil(totalLoanAmount / loanDays);

      // ২. ইউজার আজকে ম্যানুয়ালি মোট কত টাকা পরিশোধ করেছে তা চেক করা
      let paidToday = 0;
      if (loanData.history && Array.isArray(loanData.history)) {
        loanData.history.forEach(item => {
          if (item.date === todayStr) {
            paidToday += Number(item.amount || 0);
          }
        });
      }

      // ৩. যদি ইউজার আজকে ম্যানুয়ালি নির্ধারিত ভাগের সমান বা তার বেশি পরিশোধ করে দেয়, তবে আর অটো কাটবে না
      if (paidToday >= dailyTarget) {
        console.log(`User ${userId} আজকে ইতিমধ্যে ৳${paidToday} পরিশোধ করেছেন (টার্গেট ছিল: ৳${dailyTarget}, মেয়াদ: ${loanDays} দিন)। তাই অটো কাটা হলো না।`);
        await docSnap.ref.update({ todayPaidAmount: 0 });
        continue;
      }

      // ৪. নির্ধারিত ভাগের এক ভাগ পূর্ণ হতে আর কত টাকা বাকি আছে তা বের করা
      let remainingTarget = dailyTarget - paidToday;

      // বকেয়া টাকার চেয়ে বেশি যেন না কাটে, তাই দুটোর মধ্যে যেটা কম সেটাই কাটবে
      let deductAmount = Math.min(dueAmount, remainingTarget);

      if (deductAmount <= 0) continue;

      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) continue;
      const userData = userSnap.data();

      const taskCashField = userData.taskCash !== undefined ? "taskCash" : "taskcash";
      const taskCashBalance = Number(userData[taskCashField] || 0);

      // ৫. ইউজারের টাস্ক ক্যাশে পর্যাপ্ত ব্যালেন্স থাকলে বাকি অংশটুকু কাটা
      if (taskCashBalance >= deductAmount) {
        await db.runTransaction(async (transaction) => {
          const freshUserSnap = await transaction.get(userRef);
          const freshLoanSnap = await transaction.get(docSnap.ref);

          const currentBalance = Number(freshUserSnap.data()[taskCashField] || 0);
          const currentDue = Number(freshLoanSnap.data().dueAmount);

          if (currentBalance >= deductAmount && currentDue > 0) {
            const newDue = currentDue - deductAmount;

            let history = freshLoanSnap.data().history || [];
            history.push({
              date: todayStr,
              amount: deductAmount,
              type: "অটো ডিডাকশন"
            });

            let updateData = {
              dueAmount: newDue,
              todayPaidAmount: 0,
              history: history
            };

            if (newDue <= 0) {
              updateData.status = "paid";
            }

            transaction.update(userRef, {
              [taskCashField]: admin.firestore.FieldValue.increment(-deductAmount)
            });
            transaction.update(docSnap.ref, updateData);
          }
        });
        console.log(`User ${userId} এর লোন থেকে বাকি ৳${deductAmount} অটো কাটা হয়েছে (মেয়াদ: ${loanDays} দিন)।`);
      } else {
        console.log(`User ${userId} এর টাস্ক ক্যাশে পর্যাপ্ত ব্যালেন্স নেই।`);
        await docSnap.ref.update({ todayPaidAmount: 0 });
      }
    }
    console.log("অটো লোন ডিডাকশন চেক সম্পন্ন হয়েছে।");
  } catch (error) {
    console.error("ত্রুটি ঘটেছে:", error);
  }
}

runAutoDeduct();
