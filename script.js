// টাস্ক স্ট্যাটাস বক্স আপডেট করার ফাংশন
function checkTaskCompletion(completedTasks, totalPackageTasks) {
    const ongoingBox = document.getElementById('task-ongoing-box');
    const finishedBox = document.getElementById('task-finished-box');

    if (!ongoingBox || !finishedBox) return;

    // যদি সম্পন্ন কাজ মোট কাজের সমান বা বেশি হয় (যেমন: ১০/১০, ১৫/১৫ বা ২০/২০)
    if (completedTasks >= totalPackageTasks && totalPackageTasks > 0) {
        ongoingBox.style.display = 'none';
        finishedBox.style.display = 'block';
    } else {
        ongoingBox.style.display = 'block';
        finishedBox.style.display = 'none';
    }
}

// পেজ লোড হওয়ার পর টেস্ট বা রিয়েল ডাটা সেট করার অংশ
document.addEventListener("DOMContentLoaded", () => {
    // এখানে আপনার ফায়ারবেস বা লোকাল স্টোরেজ থেকে পাওয়া মান বসবে
    // উদাহরণস্বরূপ: বর্তমান সম্পন্ন টাস্ক এবং মোট টাস্কের মান নিচে দেওয়া হলো
    let completedTasks = 10; // এটি আপনার কোড অনুযায়ী ডাইনামিক হবে
    let totalPackageTasks = 10; // এটিও প্যাকেজ অনুযায়ী ডাইনামিক হবে

    // স্ক্রিনে টাস্ক কাউন্ট আপডেট করা
    const taskCountElem = document.getElementById('task-count');
    if (taskCountElem) {
        taskCountElem.innerText = `আজকের সম্পন্ন টাস্ক: ${completedTasks} / ${totalPackageTasks}`;
    }

    // বক্স পরিবর্তনের ফাংশনটি কল করা হলো
    checkTaskCompletion(completedTasks, totalPackageTasks);
});
