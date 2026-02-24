import React from 'react';
import logo from './logo.svg';
import './App.css';
import { get } from 'http';

function App() {
  // 席の初期設定
  const [rows, setRows] = React.useState(7);
  const [cols, setCols] = React.useState(6);
  // const add_row = get
  const seatingChart = [...Array(rows).map(() => Array(cols).fill("机"))]
  return (
    <div className="App">
      <div className="tool_head">
        <a className="back_home" href="/">
          <img className="back_home_img" src="/img/esc.png"/>
          ホームへ戻る
        </a>
        <h1 className="tool_title">席替えスロットル</h1>
      </div>
      <div className="table_area">
        <div className="table_rows">
          {soyBeans.map((_, index) => (
          <div key={index} style={{ fontSize: '10px' }}>あ</div>
        ))}
        </div>
      </div>
    </div>
  );
}

export default App;
