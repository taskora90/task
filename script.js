// এই ফাংশনটি চেক করবে কাজ শেষ হয়েছে কি না
function checkTaskCompletion(completedTasks, totalPackageTasks) {
    const ongoingBox = document.getElementById('task-ongoing-box');
    const finishedBox = document.getElementById('task-finished-box');

    // যদি সম্পন্ন কাজ মোট কাজের সমান বা বেশি হয় (যেমন: ১৫/১৫ বা ২০/২০)
    if (completedTasks >= totalPackageTasks && totalPackageTasks > 0) {
        if(ongoingBox) ongoingBox.style.display = 'none';
        if(finishedBox) finishedBox.style.display = 'block';
    } else {
        if(ongoingBox) ongoingBox.style.display = 'block';
        if(finishedBox) finishedBox.style.display = 'none';
    }
}

