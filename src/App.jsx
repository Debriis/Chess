// App.js
import React, { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import "./App.css";

// Import chess piece images
import wp from "./assets/wp.png";
import wr from "./assets/wr.png";
import wn from "./assets/wk.png";
import wb from "./assets/wb.png";
import wq from "./assets/wq.png";
import wk from "./assets/b1.png";
import bp from "./assets/bp.png";
import br from "./assets/br.png";
import bn from "./assets/bk.png";
import bb from "./assets/bb.png";
import bq from "./assets/bq.png";
import bk from "./assets/w1.png";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

const pieceIcons = {
  p: { w: wp, b: bp },
  r: { w: wr, b: br },
  n: { w: wn, b: bn },
  b: { w: wb, b: bb },
  q: { w: wq, b: bq },
  k: { w: wk, b: bk },
};

function pieceToChar(piece) {
  if (!piece) return null;
  return (
    <img
      src={pieceIcons[piece.type][piece.color]}
      alt={`${piece.color}${piece.type}`}
      className="chess-piece"
      draggable={false}
    />
  );
}

export default function App() {
  const gameRef = useRef(new Chess());

  const [historyFEN, setHistoryFEN] = useState([gameRef.current.fen()]);
  const [pointer, setPointer] = useState(0);
  const [selected, setSelected] = useState(null);
  const [boardArray, setBoardArray] = useState(gameRef.current.board());
  const [flip, setFlip] = useState(false);
  const [status, setStatus] = useState("");

  function refreshFromGame() {
    setBoardArray(gameRef.current.board());
    setStatus(getStatusText());
  }

  useEffect(() => {
    refreshFromGame();
    
  }, []);

  function coordsToSquare(r, c) {
    const file = files[c];
    const rank = 8 - r;
    return `${file}${rank}`;
  }

  function handleSquareClick(r, c) {
    const square = coordsToSquare(r, c);
    const piece = gameRef.current.get(square);

    // select piece of side to move
    if (!selected) {
      if (piece && piece.color === gameRef.current.turn()) {
        setSelected(square);
      }
      return;
    }

    // deselect if same
    if (selected === square) {
      setSelected(null);
      return;
    }

    // try to move
    const move = { from: selected, to: square, promotion: "q" };
    const result = gameRef.current.move(move);
    if (result) {
      const newFEN = gameRef.current.fen();
      const newHistory = historyFEN.slice(0, pointer + 1);
      newHistory.push(newFEN);
      setHistoryFEN(newHistory);
      setPointer(newHistory.length - 1);
      setSelected(null);
      refreshFromGame();
    } else {
      // if clicked another friendly piece, change selection
      if (piece && piece.color === gameRef.current.turn()) {
        setSelected(square);
      }
    }
  }

  function undo() {
    if (pointer <= 0) return;
    const newPointer = pointer - 1;
    const fen = historyFEN[newPointer];
    gameRef.current.load(fen);
    setPointer(newPointer);
    setSelected(null);
    refreshFromGame();
  }

  function redo() {
    if (pointer >= historyFEN.length - 1) return;
    const newPointer = pointer + 1;
    const fen = historyFEN[newPointer];
    gameRef.current.load(fen);
    setPointer(newPointer);
    setSelected(null);
    refreshFromGame();
  }

  function newGame() {
    gameRef.current = new Chess();
    const fen = gameRef.current.fen();
    setHistoryFEN([fen]);
    setPointer(0);
    setSelected(null);
    refreshFromGame();
  }

  function getStatusText() {
    if (gameRef.current.isCheckmate())
      return `Checkmate. ${
        gameRef.current.turn() === "w" ? "Black" : "White"
      } wins.`;
    if (gameRef.current.isStalemate()) return "Stalemate.";
    if (gameRef.current.isDraw()) return "Draw.";
    if (gameRef.current.isCheck())
      return `${gameRef.current.turn() === "w" ? "White" : "Black"} to move — in check.`;
    return `${gameRef.current.turn() === "w" ? "White" : "Black"} to move.`;
  }

  function renderSquare(r, c) {
    const square = coordsToSquare(r, c);
    const piece = gameRef.current.get(square);
    const display = pieceToChar(piece);
    const isSelected = selected === square;
    const dark = (r + c) % 2 === 1;

    return (
      <div
        key={square}
        onClick={() => handleSquareClick(r, c)}
        className={`square ${dark ? "dark" : "light"} ${isSelected ? "selected" : ""}`}
      >
        {display}
      </div>
    );
  }

  function renderBoard() {
    const rows = [];
    const ranks = boardArray;
    const renderedRanks = flip ? [...ranks].reverse() : ranks;
    for (let rr = 0; rr < 8; rr++) {
      const cols = [];
      for (let cc = 0; cc < 8; cc++) {
        const realR = flip ? 7 - rr : rr;
        const realC = flip ? 7 - cc : cc;
        cols.push(renderSquare(realR, realC));
      }
      rows.push(
        <div key={rr} className="board-row">
          {cols}
        </div>
      );
    }
    return rows;
  }

  function exportPGN() {
    return gameRef.current.pgn();
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Chess</h1>
        <div className="controls">
          <button onClick={newGame}>New Game</button>
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <button onClick={() => setFlip(f => !f)}>Flip</button>
          <button onClick={() => navigator.clipboard?.writeText(exportPGN())}>Copy PGN</button>
        </div>
      </div>

      <div className="main">
        <div className="board">{renderBoard()}</div>

        <div className="sidebar">
          <div className="status">{status}</div>

          <div className="moves">
            <h3>Move List:</h3>
            <ol>
              {gameRef.current.history().map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ol>
          </div>

          {/* <div className="history">
            <h3>History Snapshots (pointer {pointer})</h3>
            <ol>
              {historyFEN.map((f, i) => (
                <li key={i} className={i === pointer ? "current" : ""}>
                  {i}: {f}
                </li>
              ))}
            </ol>
          </div> */}  
        </div>
      </div>
    </div>
  );
}
