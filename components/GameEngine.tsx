
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameStatus, Position, Player, Zombie, Bullet, Particle, 
  ZombieType, WeaponType 
} from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_RADIUS, PLAYER_SPEED, 
  ZOMBIE_STATS, WEAPONS, PLAYER_START_HEALTH, INITIAL_AMMO 
} from '../constants';

interface GameEngineProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onWaveComplete: (wave: number) => void;
  currentWave: number;
}

const GameEngine: React.FC<GameEngineProps> = ({ status, onGameOver, onWaveComplete, currentWave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    radius: PLAYER_RADIUS,
    color: '#3b82f6',
    health: PLAYER_START_HEALTH,
    maxHealth: PLAYER_START_HEALTH,
    angle: 0,
    score: 0,
    ammo: INITIAL_AMMO[WeaponType.PISTOL],
    maxAmmo: 100,
    lastShot: 0,
    weapon: WeaponType.PISTOL
  });
  
  const zombiesRef = useRef<Zombie[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<Position>({ x: 0, y: 0 });
  const isMouseDownRef = useRef<boolean>(false);
  const killQuotaRef = useRef<number>(0);
  const killsInCurrentWaveRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);

  const [uiStats, setUiStats] = useState({
    health: PLAYER_START_HEALTH,
    score: 0,
    ammo: INITIAL_AMMO[WeaponType.PISTOL],
    weapon: WeaponType.PISTOL,
    waveKills: 0,
    totalWaveNeeded: 0
  });

  const initWave = useCallback(() => {
    // Each wave requires more kills to progress
    killQuotaRef.current = 5 + (currentWave * 5);
    killsInCurrentWaveRef.current = 0;
    lastSpawnTimeRef.current = performance.now();
    
    setUiStats(prev => ({ 
      ...prev, 
      waveKills: 0, 
      totalWaveNeeded: killQuotaRef.current 
    }));
  }, [currentWave]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      initWave();
    }
  }, [status, initWave]);

  const spawnZombie = () => {
    // Limit active zombies for performance, but keep it high enough for "constant" feel
    if (zombiesRef.current.length > 60) return;

    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (edge === 0) { x = Math.random() * CANVAS_WIDTH; y = -50; }
    else if (edge === 1) { x = CANVAS_WIDTH + 50; y = Math.random() * CANVAS_HEIGHT; }
    else if (edge === 2) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 50; }
    else { x = -50; y = Math.random() * CANVAS_HEIGHT; }

    const roll = Math.random();
    let type = ZombieType.NORMAL;
    if (roll > 0.9) type = ZombieType.TANK;
    else if (roll > 0.7) type = ZombieType.FAST;

    const stats = ZOMBIE_STATS[type];
    // Scale zombie health and speed after Wave 1
    const difficultyMultiplier = 1 + (currentWave - 1) * 0.15;

    zombiesRef.current.push({
      id: Math.random().toString(),
      pos: { x, y },
      radius: stats.radius,
      color: stats.color,
      health: stats.health * difficultyMultiplier,
      speed: stats.speed * (1 + (currentWave - 1) * 0.05),
      damage: stats.damage,
      type
    });
  };

  const createBloodParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        radius: Math.random() * 3 + 1,
        color: color,
        velocity: {
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6
        },
        life: 0,
        maxLife: 20 + Math.random() * 15
      });
    }
  };

  const fireWeapon = () => {
    const player = playerRef.current;
    const weapon = WEAPONS[player.weapon];
    const now = performance.now();

    if (now - player.lastShot < weapon.cooldown) return;
    
    if (player.weapon !== WeaponType.PISTOL) {
        if (player.ammo <= 0) {
            player.weapon = WeaponType.PISTOL;
            setUiStats(prev => ({ ...prev, weapon: WeaponType.PISTOL, ammo: Infinity }));
            return;
        }
        player.ammo -= weapon.ammoUsage;
    }

    player.lastShot = now;

    for (let i = 0; i < weapon.bulletsPerShot; i++) {
      const spread = (Math.random() - 0.5) * weapon.spread;
      const angle = player.angle + spread;
      const velocity = {
        x: Math.cos(angle) * 15,
        y: Math.sin(angle) * 15
      };

      bulletsRef.current.push({
        id: Math.random().toString(),
        pos: { ...player.pos },
        radius: 3,
        color: '#fbbf24',
        velocity,
        damage: weapon.damage
      });
    }

    setUiStats(prev => ({ ...prev, ammo: player.ammo }));
  };

  const update = (time: number) => {
    if (status !== GameStatus.PLAYING) return;

    const player = playerRef.current;

    // Movement
    if (keysRef.current['w'] || keysRef.current['ArrowUp']) player.pos.y -= PLAYER_SPEED;
    if (keysRef.current['s'] || keysRef.current['ArrowDown']) player.pos.y += PLAYER_SPEED;
    if (keysRef.current['a'] || keysRef.current['ArrowLeft']) player.pos.x -= PLAYER_SPEED;
    if (keysRef.current['d'] || keysRef.current['ArrowRight']) player.pos.x += PLAYER_SPEED;

    player.pos.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.pos.x));
    player.pos.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.pos.y));

    player.angle = Math.atan2(mouseRef.current.y - player.pos.y, mouseRef.current.x - player.pos.x);

    if (isMouseDownRef.current) fireWeapon();

    // Constant spawning logic - spawn rate increases with waves
    const spawnInterval = Math.max(200, 1200 - (currentWave * 150));
    if (time - lastSpawnTimeRef.current > spawnInterval) {
      spawnZombie();
      lastSpawnTimeRef.current = time;
    }

    // Update Zombies & Collision with Player
    zombiesRef.current.forEach(zombie => {
      if (zombie.health <= 0) return;
      const dx = player.pos.x - zombie.pos.x;
      const dy = player.pos.y - zombie.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      zombie.pos.x += (dx / dist) * zombie.speed;
      zombie.pos.y += (dy / dist) * zombie.speed;

      if (dist < player.radius + zombie.radius) {
        player.health -= 0.5;
        if (player.health <= 0) onGameOver(player.score);
        setUiStats(prev => ({ ...prev, health: Math.max(0, Math.ceil(player.health)) }));
      }
    });

    // Update Bullets & Collision with Zombies
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      bullet.pos.x += bullet.velocity.x;
      bullet.pos.y += bullet.velocity.y;

      for (const zombie of zombiesRef.current) {
        // FIX: Skip zombies that are already dead to prevent "multi-kill" from one blast
        if (zombie.health <= 0) continue;

        const dx = zombie.pos.x - bullet.pos.x;
        const dy = zombie.pos.y - bullet.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < zombie.radius + bullet.radius) {
          zombie.health -= bullet.damage;
          createBloodParticles(bullet.pos.x, bullet.pos.y, '#ef4444');
          
          if (zombie.health <= 0) {
            zombie.health = -Infinity; // Mark definitively dead
            player.score += (zombie.type === ZombieType.TANK ? 150 : zombie.type === ZombieType.FAST ? 75 : 25);
            killsInCurrentWaveRef.current++;
            
            setUiStats(prev => ({ 
                ...prev, 
                score: player.score, 
                waveKills: killsInCurrentWaveRef.current 
            }));
            createBloodParticles(zombie.pos.x, zombie.pos.y, '#7f1d1d');
          }
          return false; // Bullet consumed
        }
      }

      return bullet.pos.x >= -50 && bullet.pos.x <= CANVAS_WIDTH + 50 && bullet.pos.y >= -50 && bullet.pos.y <= CANVAS_HEIGHT + 50;
    });

    // Cleanup dead zombies
    zombiesRef.current = zombiesRef.current.filter(z => z.health > 0);

    // Update Particles
    particlesRef.current.forEach(p => {
      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;
      p.life++;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

    // Check Wave Completion
    if (killsInCurrentWaveRef.current >= killQuotaRef.current) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        onWaveComplete(currentWave);
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Vignette / Flashlight
    const player = playerRef.current;
    const gradient = ctx.createRadialGradient(
      player.pos.x, player.pos.y, 100,
      player.pos.x, player.pos.y, 600
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.92)');
    
    // Grid lines for depth
    ctx.strokeStyle = '#151515';
    ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_WIDTH; i+=100) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for(let i=0; i<CANVAS_HEIGHT; i+=100) {
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = 1 - (p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Bullets
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Zombies
    zombiesRef.current.forEach(z => {
      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.arc(z.pos.x, z.pos.y, z.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(z.pos.x - 4, z.pos.y - 4, 2, 0, Math.PI * 2);
      ctx.arc(z.pos.x + 4, z.pos.y - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player
    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(player.angle);
    
    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Weapon Barrel
    ctx.fillStyle = '#64748b';
    ctx.fillRect(12, -4, 22, 8);
    
    ctx.restore();

    // Dark Overlay
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  }, []);

  const gameLoop = useCallback((time: number) => {
    update(time);
    draw();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [draw, update]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current[e.key] = true;
    const handleKeyUp = (e: KeyboardEvent) => {
        keysRef.current[e.key] = false;
        if (e.key === '1') {
            playerRef.current.weapon = WeaponType.PISTOL;
            setUiStats(prev => ({ ...prev, weapon: WeaponType.PISTOL, ammo: Infinity }));
        }
        if (e.key === '2') {
            playerRef.current.weapon = WeaponType.SHOTGUN;
            setUiStats(prev => ({ ...prev, weapon: WeaponType.SHOTGUN, ammo: playerRef.current.ammo }));
        }
        if (e.key === '3') {
            playerRef.current.weapon = WeaponType.RIFLE;
            setUiStats(prev => ({ ...prev, weapon: WeaponType.RIFLE, ammo: playerRef.current.ammo }));
        }
    };
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };
    const handleMouseDown = () => isMouseDownRef.current = true;
    const handleMouseUp = () => isMouseDownRef.current = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="border-2 border-red-900 shadow-2xl shadow-red-900/40 rounded-sm"
      />
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-10 font-mono text-white">
        {/* HUD Top */}
        <div className="flex justify-between items-start">
          <div className="bg-black/80 border border-zinc-800 p-5 rounded-lg backdrop-blur-md">
            <h2 className="text-red-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Tactical Overlay</h2>
            <div className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <span className="text-zinc-500 text-sm">WAVE</span> {currentWave}
            </div>
            <div className="mt-3">
              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-500"
                  style={{ width: `${(uiStats.waveKills / uiStats.totalWaveNeeded) * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1 flex justify-between uppercase">
                <span>Progress</span>
                <span>{uiStats.waveKills} / {uiStats.totalWaveNeeded} Kills</span>
              </div>
            </div>
          </div>
          
          <div className="bg-black/80 border border-zinc-800 p-5 rounded-lg backdrop-blur-md text-right">
            <h2 className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Total Score</h2>
            <div className="text-4xl font-black text-white">{uiStats.score.toLocaleString()}</div>
          </div>
        </div>

        {/* HUD Bottom Left: Vitals */}
        <div className="absolute bottom-10 left-10 w-80">
           <div className="mb-3 flex justify-between items-end">
             <span className="text-red-500 font-black uppercase text-xs tracking-widest">Biometric Status</span>
             <span className="text-2xl font-black">{uiStats.health}%</span>
           </div>
           <div className="h-3 bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden p-[2px]">
             <div 
               className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.6)]"
               style={{ width: `${uiStats.health}%` }}
             ></div>
           </div>
        </div>

        {/* HUD Bottom Right: Weaponry */}
        <div className="absolute bottom-10 right-10 text-right">
           <div className="bg-black/80 border border-zinc-800 p-4 rounded-lg backdrop-blur-md inline-block">
             <div className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-1">Combat Module</div>
             <div className="flex gap-4 items-center justify-end">
                <div className="text-right">
                  <div className="text-4xl font-black leading-none">{uiStats.weapon === WeaponType.PISTOL ? '∞' : uiStats.ammo}</div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">{uiStats.weapon}</div>
                </div>
                <div className="w-12 h-12 border-2 border-amber-600/30 flex items-center justify-center rounded">
                   <div className="w-6 h-1 bg-amber-500"></div>
                </div>
             </div>
             <div className="flex gap-2 mt-4 justify-end">
               <span className={`px-2 py-1 text-[9px] font-bold border ${uiStats.weapon === WeaponType.PISTOL ? 'border-amber-500 text-amber-500' : 'border-zinc-800 text-zinc-600'}`}>1: PISTOL</span>
               <span className={`px-2 py-1 text-[9px] font-bold border ${uiStats.weapon === WeaponType.SHOTGUN ? 'border-amber-500 text-amber-500' : 'border-zinc-800 text-zinc-600'}`}>2: SHOTGUN</span>
               <span className={`px-2 py-1 text-[9px] font-bold border ${uiStats.weapon === WeaponType.RIFLE ? 'border-amber-500 text-amber-500' : 'border-zinc-800 text-zinc-600'}`}>3: RIFLE</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GameEngine;
