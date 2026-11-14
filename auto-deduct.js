const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function runAutoDeduct() {
  try {
    const loansRef = db.collection("loan_requests");
    const snapshot = await loansRef.where("status", "in", ["approved", "active"]).get();

    if (snapshot.empty) {
      console.log("কোনো সক্রিয় লোন পাওয়া যায়নি।");
      return;
    }

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

      // ১. পুরো লোনকে ১৫ ভাগে ভাগ করে প্রতি দিনের বা প্রতি ভাগের টার্গেট হিসাব করা (যেমন: ৪৫০ / ১৫ = ৩০ টাকা)
      const dailyTarget = Math.ceil(totalLoanAmount / 15);


      // ২. ইউজার আজকে ম্যানুয়ালি মোট কত টাকা পরিশোধ করেছে তা চেক করা
      let paidToday = 0;
      if (loanData.history && Array.isArray(loanData.history)) {
        loanData.history.forEach(item => {
          if (item.date === todayStr) {
            paidToday += Number(item.amount || 0);
          }
        });
      }

      // ৩. যদি ইউজার আজকে ম্যানুয়ালি ১৫ ভাগের সমান বা তার বেশি পরিশোধ করে দেয়, তবে আর অটো কাটবে না
      if (paidToday >= dailyTarget) {
        console.log(`User ${userId} আজকে ইতিমধ্যে ৳${paidToday} পরিশোধ করেছেন (টার্গেট ছিল: ৳${dailyTarget})। তাই অটো কাটা হলো না।`);
        await docSnap.ref.update({ todayPaidAmount: 0 });
        continue;
      }

      // ৪. ১৫ ভাগের এক ভাগ পূর্ণ হতে আর কত টাকা বাকি আছে তা বের করা (যেমন: ৩০ - ২০ = ১০ টাকা)
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
              type: "অটো ডিডাকশন (রাত ১০টা)"
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
            transaction.update(docSnap.ref, updateData); // এখানে docSnap.ref ব্যবহার করা হয়েছে
          }
        });
        console.log(`User ${userId} এর লোন থেকে বাকি ৳${deductAmount} অটো কাটা হয়েছে।`);
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
