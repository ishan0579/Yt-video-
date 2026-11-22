// Scene order for the full episode.
import { prepLines } from '../dialogue.mjs';
import { coldOpen, title, loading } from './s_intro.mjs';
import beach from './s_beach.mjs';
import cartheft from './s_car.mjs';
import bikechase from './s_bike.mjs';
import pool from './s_pool.mjs';
import plan from './s_plan.mjs';
import bank from './s_bank.mjs';
import autochase from './s_auto.mjs';
import { mummy, hospital, outro } from './s_end.mjs';

export const SCENES = [coldOpen, title, loading, beach, cartheft, bikechase, pool, plan, bank, autochase, mummy, hospital, outro];
SCENES.forEach((s, i) => { s._lines = prepLines(s.lines || [], i + 1); });
