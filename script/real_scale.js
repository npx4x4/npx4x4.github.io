export {};
console.log("Hello World");
// 画面サイズ(画素数を取得)
let scr_w = screen.width;
let scr_h = screen.height;
//html要素を取得
let ele = document.documentElement;
const showResolution = document.getElementById('show_resolution');
const setButton = document.getElementById('rs_set');
const simGround = document.getElementById('sim_ground');
showResolution.innerText = `デバイスの解像度: ${scr_w} x  ${scr_h}`;
simGround.style.display = "none";
function rs_start() {
    simGround.style.display = "block";
}
setButton.addEventListener('click', rs_start);
//# sourceMappingURL=real_scale.js.map