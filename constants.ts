
import { WeaponType, WeaponStats } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const PLAYER_RADIUS = 20;
export const PLAYER_SPEED = 4;
export const PLAYER_START_HEALTH = 100;

export const ZOMBIE_STATS = {
  NORMAL: { radius: 18, speed: 1.2, health: 30, damage: 10, color: '#4d7c0f' },
  FAST: { radius: 14, speed: 2.2, health: 15, damage: 5, color: '#fbbf24' },
  TANK: { radius: 30, speed: 0.6, health: 100, damage: 25, color: '#991b1b' }
};

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  [WeaponType.PISTOL]: {
    damage: 15,
    cooldown: 250,
    ammoUsage: 0, // Infinite
    spread: 0.05,
    bulletsPerShot: 1
  },
  [WeaponType.SHOTGUN]: {
    damage: 12,
    cooldown: 800,
    ammoUsage: 1,
    spread: 0.4,
    bulletsPerShot: 6
  },
  [WeaponType.RIFLE]: {
    damage: 10,
    cooldown: 100,
    ammoUsage: 1,
    spread: 0.1,
    bulletsPerShot: 1
  }
};

export const INITIAL_AMMO = {
  [WeaponType.PISTOL]: Infinity,
  [WeaponType.SHOTGUN]: 12,
  [WeaponType.RIFLE]: 60
};
