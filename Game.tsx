import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const saveScore = useMutation(api.scores.saveScore);
  const topScores = useQuery(api.scores.getTopScores) || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let obstacles: { x: number; y: number; width: number; height: number }[] = [];
    let playerY = canvas.height / 2;
    let speed = 2;
    
    const player = {
      x: 50,
      width: 30,
      height: 30,
    };

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    function addObstacle() {
      const height = Math.random() * (canvasHeight / 3) + 30;
      obstacles.push({
        x: canvasWidth,
        y: Math.random() * (canvasHeight - height),
        width: 20,
        height,
      });
    }

    function handleTouch(e: TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      playerY = ((touch.clientY - rect.top) / rect.height) * canvasHeight;
    }

    function handleMouse(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      playerY = ((e.clientY - rect.top) / rect.height) * canvasHeight;
    }

    canvas.addEventListener("touchmove", handleTouch);
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("touchstart", handleTouch);

    let lastObstacleTime = 0;
    const obstacleInterval = 2000;

    function gameLoop(timestamp: number) {
      if (!ctx) return;
      
      if (timestamp - lastObstacleTime > obstacleInterval) {
        addObstacle();
        lastObstacleTime = timestamp;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw player
      ctx.fillStyle = "#4F46E5";
      ctx.fillRect(player.x, playerY - player.height/2, player.width, player.height);

      // Update and draw obstacles
      obstacles = obstacles.filter(obstacle => {
        obstacle.x -= speed;
        
        // Check collision
        if (
          player.x < obstacle.x + obstacle.width &&
          player.x + player.width > obstacle.x &&
          playerY - player.height/2 < obstacle.y + obstacle.height &&
          playerY + player.height/2 > obstacle.y
        ) {
          setGameOver(true);
          return false;
        }

        // Draw obstacle
        ctx.fillStyle = "#EF4444";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        return obstacle.x > -obstacle.width;
      });

      if (!gameOver) {
        setScore(prev => prev + 1);
        speed = Math.min(8, 2 + Math.floor(score / 1000));
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("touchmove", handleTouch);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("touchstart", handleTouch);
    };
  }, [gameOver, score]);

  const handleRestart = () => {
    if (playerName.trim()) {
      saveScore({ score, playerName: playerName.trim() });
    }
    setScore(0);
    setGameOver(false);
    setPlayerName("");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[480px] h-[360px] bg-slate-100 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={480}
          height={360}
          className="touch-none"
        />
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-4">
            <h2 className="text-2xl font-bold">Game Over!</h2>
            <p className="text-xl">Score: {score}</p>
            <input
              type="text"
              placeholder="Enter your name"
              className="px-4 py-2 rounded text-black"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-indigo-500 rounded hover:bg-indigo-600"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="text-xl font-bold">Score: {score}</div>
      <div className="mt-4">
        <h3 className="text-xl font-bold mb-2">Top Scores</h3>
        <ul className="space-y-1">
          {topScores.map((score, i) => (
            <li key={score._id}>
              {i + 1}. {score.playerName}: {score.score}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
