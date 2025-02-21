import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Peer from "peerjs";
import "./App.css"; // Import CSS for layout adjustments

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [gameCode, setGameCode] = useState("");
  const [peer, setPeer] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [peerId, setPeerId] = useState(null);

  useEffect(() => {
    const newPeer = new Peer();
    setPeer(newPeer);
    newPeer.on("open", (id) => {
      console.log("My peer ID is:", id);
      setPeerId(id);
    });
  }, []);

  useEffect(() => {
    if (!peer) return;

    peer.on("connection", (conn) => {
      console.log("New connection established");
      conn.on("open", () => {
        console.log("Connection is open");
        setConnection(conn);
      });
      conn.on("data", (data) => {
        console.log("Received move:", data);
        setGame((prevGame) => {
          const newGame = new Chess(prevGame.fen());
          newGame.load(data);
          return newGame;
        });
      });
    });
  }, [peer]);

  const handleMove = (move) => {
    try {
      setGame((prevGame) => {
        const newGame = new Chess(prevGame.fen());
        newGame.move(move);
        if (connection && connection.open) {
          console.log("Sending move:", newGame.fen());
          connection.send(newGame.fen());
        } else {
          console.warn("No active connection to send move");
        }
        return newGame;
      });
    } catch (error) {
      console.error("Invalid move", error);
    }
  };

  const createGame = () => {
    if (!peerId) {
      console.warn("Peer ID not generated yet");
      return;
    }
    setGameCode(peerId);
    setIsHost(true);
    console.log("Game hosted with code:", peerId);
  };

  const joinGame = () => {
    if (!peer || !gameCode) {
      console.warn("Cannot join game: No peer instance or game code");
      return;
    }
    console.log("Attempting to connect to host", gameCode);
    const conn = peer.connect(gameCode);
    conn.on("open", () => {
      console.log("Connected to host");
      setConnection(conn);
    });
    conn.on("data", (data) => {
      console.log("Received move:", data);
      setGame((prevGame) => {
        const newGame = new Chess(prevGame.fen());
        newGame.load(data);
        return newGame;
      });
    });
  };

  return (
    <div className="app-container">
      <h1>P2P Chess</h1>
      {!isHost && !connection ? (
        <div>
          <button onClick={createGame}>Host Game</button>
          <input
            type="text"
            placeholder="Enter Game Code"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
          />
          <button onClick={joinGame}>Join Game</button>
        </div>
      ) : (
        <div className="game-container">
          <p>Game Code: {gameCode}</p>
          <div className="board-and-controls">
            <ChessBoard game={game} onMove={handleMove} />
            <div className="controls">
              <h3>Moves</h3>
              {/* Move list UI can be implemented here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChessBoard = ({ game, onMove }) => {
  return (
    <div className="chessboard-container">
      <Chessboard
        boardWidth={400} // Adjust board size to leave space
        position={game.fen()}
        onPieceDrop={(sourceSquare, targetSquare) =>
          onMove({ from: sourceSquare, to: targetSquare })
        }
      />
    </div>
  );
};

export default App;
