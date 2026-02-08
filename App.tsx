
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, WaveIntel } from './types';
import GameEngine from './components/GameEngine';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [currentWave, setCurrentWave] = useState(1);
  const [lastScore, setLastScore] = useState(0);
  const [intel, setIntel] = useState<WaveIntel | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  const startGame = () => {
    setCurrentWave(1);
    setStatus(GameStatus.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setStatus(GameStatus.GAMEOVER);
  };

  const handleWaveComplete = async (wave: number) => {
    setStatus(GameStatus.LOADING_WAVE);
    setLoadingIntel(true);
    const nextWave = wave + 1;
    setCurrentWave(nextWave);
    
    // Fetch AI Intel for the next wave
    const report = await geminiService.generateWaveIntel(nextWave);
    setIntel(report);
    setLoadingIntel(false);
  };

  const proceedToNextWave = () => {
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative crt-overlay">
      {status === GameStatus.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1615569675312-3200d740f93e?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative z-10 text-center px-4">
            <h1 className="text-8xl md:text-9xl font-zombie text-red-600 mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse">
              ZOMBIE FPS 2D
            </h1>
            <p className="text-gray-400 font-mono text-sm tracking-[0.3em] mb-12 uppercase">
              // Neural Link Established // Tactical Feed Active
            </p>
            <button 
              onClick={startGame}
              className="bg-red-700 hover:bg-red-600 text-white font-black py-4 px-12 text-2xl uppercase tracking-tighter transition-all hover:scale-110 active:scale-95 border-b-8 border-red-900 rounded-lg"
            >
              Initialize Purge
            </button>
            <div className="mt-12 grid grid-cols-3 gap-8 text-left max-w-2xl mx-auto opacity-60">
                <div className="border-l border-red-900 pl-4">
                    <span className="block text-red-500 font-mono text-xs mb-1">MOVEMENT</span>
                    <span className="text-white font-mono text-sm">WASD / ARROWS</span>
                </div>
                <div className="border-l border-red-900 pl-4">
                    <span className="block text-red-500 font-mono text-xs mb-1">TARGETING</span>
                    <span className="text-white font-mono text-sm">MOUSE AIM/FIRE</span>
                </div>
                <div className="border-l border-red-900 pl-4">
                    <span className="block text-red-500 font-mono text-xs mb-1">ARSENAL</span>
                    <span className="text-white font-mono text-sm">KEYS 1, 2, 3</span>
                </div>
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.PLAYING && (
        <GameEngine 
          status={status} 
          onGameOver={handleGameOver} 
          onWaveComplete={handleWaveComplete}
          currentWave={currentWave}
        />
      )}

      {status === GameStatus.LOADING_WAVE && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-50 p-6">
          <div className="max-w-3xl w-full border border-zinc-800 bg-zinc-900 p-10 rounded-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            
            {loadingIntel ? (
              <div className="flex flex-col items-center py-20">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-red-500 font-mono animate-pulse uppercase tracking-widest">Intercepting Wave {currentWave} Intel...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <span className="bg-red-600 text-black px-3 py-1 text-xs font-black uppercase">Interception Successful</span>
                  <span className="text-zinc-500 font-mono text-xs tracking-tighter">TIMESTAMP: {new Date().toLocaleTimeString()}</span>
                </div>

                <h2 className="text-4xl font-zombie text-white mb-4 uppercase tracking-wide">
                  {String(intel?.title || "SITUATION REPORT")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div>
                    <h3 className="text-red-500 text-xs font-bold uppercase mb-2 tracking-[0.2em]">Summary</h3>
                    <p className="text-zinc-300 font-mono text-sm leading-relaxed">
                      {String(intel?.description || "No clear summary available.")}
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-amber-500 text-xs font-bold uppercase mb-2 tracking-[0.2em]">Mutation Log</h3>
                      <p className="text-zinc-300 font-mono text-sm italic">
                        "{String(intel?.mutationNote || "No specific mutations detected.")}"
                      </p>
                    </div>
                    <div>
                      <h3 className="text-zinc-500 text-xs font-bold uppercase mb-2 tracking-[0.2em]">Threat Index</h3>
                      <div className="text-2xl font-black text-red-500 font-mono">{String(intel?.threatLevel || "NORMAL")}</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={proceedToNextWave}
                  className="w-full bg-zinc-100 hover:bg-white text-black font-black py-4 uppercase tracking-widest transition-all rounded"
                >
                  Deploy to Wave {currentWave}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[100] p-4 text-center">
          <h1 className="text-9xl font-zombie text-red-600 mb-2 animate-bounce">YOU DIED</h1>
          <p className="text-zinc-500 font-mono mb-8 uppercase tracking-[0.5em]">The horde has consumed your soul.</p>
          
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg mb-12 max-w-sm w-full">
            <div className="text-sm text-zinc-500 uppercase font-bold mb-1">Final Score</div>
            <div className="text-6xl font-black text-white mb-6">{lastScore.toLocaleString()}</div>
            <div className="text-sm text-zinc-500 uppercase font-bold mb-1">Waves Survived</div>
            <div className="text-3xl font-bold text-red-500">{currentWave - 1}</div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={startGame}
              className="bg-red-700 hover:bg-red-600 text-white font-bold py-4 px-12 uppercase tracking-tighter transition-all"
            >
              Try Again
            </button>
            <button 
              onClick={() => setStatus(GameStatus.MENU)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-12 uppercase tracking-tighter transition-all"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
