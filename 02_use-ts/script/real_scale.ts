export{}
console.log("Hello World");

// 画面サイズ(画素数を取得)
let scrWidth: number = screen.width;
let scrHeight: number = screen.height;

//html要素を取得
let ele = document.documentElement;
const rsMenuValue = document.forms[0] as HTMLFormElement;
const showResolution = document.getElementById('show_resolution') as HTMLElement;
const setButton = document.getElementById('rs_set') as HTMLElement;
const simGround = document.getElementById('sim_ground') as HTMLElement;
const simShape = document.getElementById('sim_shape') as HTMLElement;

// インチ -> ミリ変換用
const mm: number = 25.4;

showResolution.innerText = `デバイスの解像度: ${scrWidth} x  ${scrHeight}`;
simGround.style.display = "none";
simShape.style.display = "none";

function getPixelSize(diagonal: number) {
    // 
    return diagonal*mm / Math.sqrt(scrWidth**2 + scrHeight**2);
}

function drawSimShape(diagonal: number, w: number, h: number, pixelSize: number) {
    let shapeWidth = diagonal*mm / Math.sqrt(w**2 + h**2) * w / pixelSize;
    let shapeHeight = diagonal*mm / Math.sqrt(w**2 + h**2) * h / pixelSize;
    simShape.style.width = shapeWidth + "px";
    simShape.style.height = shapeHeight + "px";
}

function rs_start() {
    simGround.style.display = "block";
    simShape.style.display = "block";
    let diagonal = rsMenuValue.screen_diagonal as HTMLInputElement;
    let diagonalVal = diagonal.value;
    let pixelSize= getPixelSize(Number(diagonalVal));
    
    let simScrDiagonal = rsMenuValue.sim_screen_diagonal as HTMLInputElement;
    let simScrDiagonalVal = Number(simScrDiagonal.value);
    let aspectW= rsMenuValue.aspect_w as HTMLInputElement;
    let aspectWVal = Number(aspectW.value); 
    let aspectH= rsMenuValue.aspect_h as HTMLInputElement;
    let aspectHVal = Number(aspectH.value); 
    drawSimShape(simScrDiagonalVal, aspectWVal, aspectHVal, pixelSize)
    console.log(pixelSize);

}

setButton.addEventListener('click', rs_start);

//esc押したらシミュレートモード終了
document.addEventListener('keydown', function(e) {
  if(e.key === 'Escape'){
    simGround.style.display = "none";
    simShape.style.display = "none";
  }
})