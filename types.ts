
export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  LOADING_WAVE = 'LOADING_WAVE'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Position;
  radius: number;
  color: string;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  angle: number;
  score: number;
  ammo: number;
  maxAmmo: number;
  lastShot: number;
  weapon: WeaponType;
}

export enum WeaponType {
  PISTOL = 'PISTOL',
  SHOTGUN = 'SHOTGUN',
  RIFLE = 'RIFLE'
}

export interface WeaponStats {
  damage: number;
  cooldown: number;
  ammoUsage: number;
  spread: number;
  bulletsPerShot: number;
}

export interface Zombie extends Entity {
  health: number;
  speed: number;
  damage: number;
  type: ZombieType;
}

export enum ZombieType {
  NORMAL = 'NORMAL',
  FAST = 'FAST',
  TANK = 'TANK'
}

export interface Bullet extends Entity {
  velocity: Position;
  damage: number;
}

export interface Particle extends Entity {
  velocity: Position;
  life: number;
  maxLife: number;
}

export interface WaveIntel {
  title: string;
  description: string;
  threatLevel: string;
  mutationNote: string;
}
