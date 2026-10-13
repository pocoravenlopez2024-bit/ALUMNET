/**
 * St. Cecilia's College - Cebu, Inc.
 * Centralized Institutional Default Image Assets & Safe Fallback Handlers
 */

import React from 'react';

// Official primary default picture assets - Set official Cecilian Crest as default profile avatar
export const DEFAULT_USER_AVATAR = '/assets/cecilians-seal.jpg';
export const DEFAULT_USER_AVATAR_SEAL = '/assets/cecilians-seal.jpg';
export const DEFAULT_COLLEGE_SEAL = '/assets/st-cecilias-college-seal.jpg';

// Official primary event & campus hero picture assets
export const DEFAULT_EVENT_IMAGE = '/assets/landing-building-2.jpg'; // St. Cecilia's College Main Hall
export const DEFAULT_COVER_PHOTO = '/assets/landing-building-1.jpg'; // St. Cecilia's Modern Tower & Quad

// Curated institutional presets for user avatars
export const USER_AVATAR_PRESETS = [
  {
    id: 'cecilian-seal',
    name: 'Cecilian Crest (Official Default)',
    url: '/assets/cecilians-seal.jpg',
    description: 'Official circular Alumni Cecilians crest seal'
  },
  {
    id: 'college-crest',
    name: 'St. Cecilia College Crest',
    url: '/assets/st-cecilias-college-seal.jpg',
    description: 'Official St. Cecilia’s College institutional heritage crest'
  },
  {
    id: 'scholar-crest',
    name: 'Cecilian Scholar',
    url: '/assets/default-avatar.svg',
    description: 'Academic graduate silhouette with crimson & gold banner'
  }
];

// Curated institutional presets for event banners
export const EVENT_IMAGE_PRESETS = [
  {
    id: 'main-building',
    name: 'Main Institutional Hall (Default)',
    url: '/assets/landing-building-2.jpg',
    description: 'St. Cecilia’s iconic main building facade with signature crimson architectural column'
  },
  {
    id: 'campus-tower',
    name: 'Modern Academic Tower',
    url: '/assets/landing-building-1.jpg',
    description: 'High-rise campus building under open Cebu skies'
  },
  {
    id: 'campus-complex',
    name: 'Collegiate Complex',
    url: '/assets/landing-building-3.jpg',
    description: 'St. Cecilia’s campus grounds and collegiate learning facilities'
  },
  {
    id: 'campus-quad',
    name: 'Campus Quadrangle',
    url: '/assets/landing-building.jpg',
    description: 'Heritage campus quadrangle and gathering grounds'
  }
];

// Curated presets for profile cover photos
export const COVER_PHOTO_PRESETS = [
  {
    id: 'tower-cover',
    name: 'Campus Tower (Default)',
    url: '/assets/landing-building-1.jpg'
  },
  {
    id: 'main-hall-cover',
    name: 'Main Institutional Hall',
    url: '/assets/landing-building-2.jpg'
  },
  {
    id: 'quad-cover',
    name: 'Campus Quadrangle',
    url: '/assets/landing-building.jpg'
  },
  {
    id: 'complex-cover',
    name: 'Campus Complex',
    url: '/assets/landing-building-3.jpg'
  }
];

/**
 * Returns a guaranteed valid user avatar URL.
 * If the user has not uploaded a picture, or if empty/null or placeholder,
 * provides the official Cecilian Crest as the default profile avatar.
 */
export function getUserAvatar(avatarUrl?: string | null): string {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return DEFAULT_USER_AVATAR;
  }
  const trimmed = avatarUrl.trim();
  if (
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === '/assets/default-avatar.svg' ||
    trimmed.includes('default-avatar.svg')
  ) {
    return DEFAULT_USER_AVATAR;
  }
  return trimmed;
}

/**
 * Returns a guaranteed valid event hero image URL.
 * If the event has no picture or an empty/null string, provides the default event banner.
 */
export function getEventImage(heroImageUrl?: string | null): string {
  if (!heroImageUrl || typeof heroImageUrl !== 'string') {
    return DEFAULT_EVENT_IMAGE;
  }
  const trimmed = heroImageUrl.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
    return DEFAULT_EVENT_IMAGE;
  }
  return trimmed;
}

/**
 * Returns a guaranteed valid cover photo URL.
 */
export function getCoverPhoto(coverPhotoUrl?: string | null): string {
  if (!coverPhotoUrl || typeof coverPhotoUrl !== 'string') {
    return DEFAULT_COVER_PHOTO;
  }
  const trimmed = coverPhotoUrl.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
    return DEFAULT_COVER_PHOTO;
  }
  return trimmed;
}

/**
 * React onError handler for user avatar <img> elements to gracefully fallback to the Cecilian Crest if image fails.
 */
export function handleUserAvatarError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget;
  if (target.src && (target.src.endsWith(DEFAULT_USER_AVATAR) || target.src.endsWith('/assets/cecilians-seal.jpg'))) {
    target.onerror = null;
    return;
  }
  target.onerror = null;
  target.src = DEFAULT_USER_AVATAR;
}

/**
 * React onError handler for event <img> elements to gracefully fallback if URL fails.
 */
export function handleEventImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget;
  if (target.src && target.src.endsWith(DEFAULT_EVENT_IMAGE)) {
    target.onerror = null;
    return;
  }
  target.onerror = null;
  target.src = DEFAULT_EVENT_IMAGE;
}

/**
 * React onError handler for profile cover <img> elements.
 */
export function handleCoverPhotoError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget;
  if (target.src && target.src.endsWith(DEFAULT_COVER_PHOTO)) {
    target.onerror = null;
    return;
  }
  target.onerror = null;
  target.src = DEFAULT_COVER_PHOTO;
}
