const timeElement = document.getElementById('time') as HTMLElement;

setInterval(() => {
    const now = new Date();
    timeElement.innerText = now.toLocaleTimeString();
}, 1000);