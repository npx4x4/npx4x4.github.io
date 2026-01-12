export{}
console.log("Hello World");

// 画面サイズ(画素数を取得)
let scr_w: number = screen.width;
let scr_h: number = screen.height;

//html要素を取得
const showResolution = document.getElementById('show_resolution') as HTMLElement;
const setButton = document.getElementById('')

showResolution.innerText = "デバイスの解像度: " + String(scr_w) + " x " + String(scr_h);


