/** Registre des activités génériques (id = id de l'archétype). */
import type { ActivityDef } from '../types';
import { findFood, findObject, findWater, greeting, nameObject } from './basic';
import { familyPresentation, helpSibling, rememberYesterday } from './family';
import { AFRICA_ACTIVITIES } from './africa';
import { familyOrders, yesOrNo } from './play';
import { animalAbilities, compareObjects, countObjects, describeActions, hideAndSeek, identifyColors, weatherCheck } from './games';

export const ACTIVITIES: readonly ActivityDef[] = [
  greeting,
  findObject,
  nameObject,
  findWater,
  findFood,
  countObjects,
  identifyColors,
  hideAndSeek,
  weatherCheck,
  animalAbilities,
  compareObjects,
  describeActions,
  familyPresentation,
  rememberYesterday,
  helpSibling,
  familyOrders,
  yesOrNo,
  ...AFRICA_ACTIVITIES,
];

export const ACTIVITY_BY_ID: Readonly<Record<string, ActivityDef>> = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));

export { GREETING_WELCOMES, TEACH_MODES, teachSteps, type TeachMode } from './basic';
