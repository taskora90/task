// ১. টাস্ক শেষ হলে বক্স পরিবর্তন করার ফাংশন
function checkTaskCompletion(completedTasks, totalPackageTasks) {
    const ongoingBox = document.getElementById('task-ongoing-box');
    const finishedBox = document.getElementById('task-finished-box');

    if (!ongoingBox || !finishedBox) return;

    // যদি কাজ শেষ হয়ে যায় (যেমন: ২/২ বা ১০/১০)
    if (completedTasks >= totalPackageTasks && totalPackageTasks > 0) {
        ongoingBox.style.display = 'none';    // জরুরি নির্দেশনা লুকিয়ে যাবে
        finishedBox.style.display = 'block';  // অভিনন্দন বক্স দেখাবে
    } else {
        ongoingBox.style.display = 'block';   // নির্দেশনা দেখাবে
        finishedBox.style.display = 'none';   // অভিনন্দন বক্স লুকিয়ে থাকবে
    }
}

// ২. পেজ লোড হওয়ার পর ফায়ারবেস বা সিস্টেম থেকে টাস্ক কাউন্ট নিয়ে আসার মূল কোড
document.addEventListener("DOMContentLoaded", () => {
    // আপনার প্রজেক্টের নিয়ম অনুযায়ী এখান থেকে বর্তমান সম্পন্ন টাস্ক এবং মোট টাস্কের মান রিড হবে
    // (যদি আপনার আগের কোনো কোড থাকে যা দিয়ে '2 / 2' বা '10 / 10' দেখায়, 
    // সেই ভেরিয়েবল দুটির মান এখানে বসবে। যেমন নিচের উদাহরণে ধরে নেওয়া হলো কাজ শেষ।)
    
    let completedTasks = 2;   // ইউজার যতটি কাজ করেছে (এটি আপনার ডেটা অনুযায়ী আসবে)
    let totalPackageTasks = 2; // মোট যতটি কাজ আছে

    // স্ক্রিনে টাস্ক কাউন্ট টেক্সট আপডেট করার জন্য (যদি এলিমেন্ট থাকে)
    const taskCountElem = document.getElementById('task-count');
    if (taskCountElem) {
        taskCountElem.innerText = `আজকের সম্পন্ন টাস্ক: ${completedTasks} / ${totalPackageTasks}`;
    }

    // বক্স পরিবর্তনের ফাংশনটি কল করা হলো
    checkTaskCompletion(completedTasks, totalPackageTasks);
});
