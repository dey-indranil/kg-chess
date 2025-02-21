import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Peer from "peerjs";

const App = () => {
  const [game, setGame] = useState(() => {
    const savedGame = localStorage.getItem("chessGame");
    return savedGame ? new Chess(savedGame) : new Chess();
  });
  const [gameCode, setGameCode] = useState(localStorage.getItem("gameCode") || "");
  const [peer, setPeer] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    localStorage.setItem("chessGame", game.fen());
  }, [game]);

  useEffect(() => {
    const newPeer = new Peer();
    setPeer(newPeer);
    newPeer.on("open", (id) => {
      console.log("My peer ID is:", id);
    });

    newPeer.on("connection", (conn) => {
      setConnection(conn);
      conn.on("data", (data) => {
        const newGame = new Chess();
        newGame.load(data);
        setGame(newGame);
      });
    });
  }, []);

  const handleMove = (move) => {
    try {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      setGame(newGame);
      
      if (connection) {
        connection.send(newGame.fen());
      }
    } catch (error) {
      console.error("Invalid move", error);
    }
  };

  const createGame = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGameCode(code);
    localStorage.setItem("gameCode", code);
    setIsHost(true);
    console.log("Game hosted with code:", code);
  };

  const joinGame = (code) => {
    setGameCode(code);
    localStorage.setItem("gameCode", code);
    
    if (peer) {
      const conn = peer.connect(code);
      conn.on("open", () => {
        setConnection(conn);
      });
      conn.on("data", (data) => {
        const newGame = new Chess();
        newGame.load(data);
        setGame(newGame);
      });
    }
  };

  return (
    <div>
      <h1>P2P Chess</h1>
      {!gameCode ? (
        <div>
          <button onClick={createGame}>Host Game</button>
          <input
            type="text"
            placeholder="Enter Game Code"
            onChange={(e) => setGameCode(e.target.value)}
          />
          <button onClick={() => joinGame(gameCode)}>Join Game</button>
        </div>
      ) : (
        <div>
          <p>Game Code: {gameCode}</p>
          <ChessBoard game={game} onMove={handleMove} />
        </div>
      )}
    </div>
  );
};

const ChessBoard = ({ game, onMove }) => {
  return (
    <div>
      <Chessboard
        position={game.fen()}
        onPieceDrop={(sourceSquare, targetSquare) =>
          onMove({ from: sourceSquare, to: targetSquare })
        }
      />
    </div>
  );
};

export default App;
