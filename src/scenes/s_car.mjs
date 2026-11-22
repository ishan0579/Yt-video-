// Scene: trying to steal a car (Dadi's car!).
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, circle, ell, rng, sparkle, dust, dizzy, iris, pow, sweat } from '../engine.mjs';
import { sky, street, shopsRow } from '../bg.mjs';
import { sportsCar, bicycle, handbag, streetLamp } from '../props.mjs';
import { wanted, money, minimap, popup, chapterCard } from '../hud.mjs';
import { bikeRide } from '../rigs.mjs';
import { drawChar } from '../characters.mjs';

const GY = 860, CAR_X = 1200, BIKE_X = 1360;
export default {
  id: 'cartheft',
  dur: 50,
  fadeIn: 0.5, fadeOut: 0,
  music: [[0, 13, 'sneaky', 0.5], [17.4, 30.5, 'sneaky', 0.35], [33.2, 50, 'chill', 0.45]],
  sfx: [
    [0, 'city', { dur: 50, vol: 0.2 }],
    [13.0, 'alarm', { dur: 4.4, vol: 0.55 }], [13.0, 'boing', { vol: 0.6 }],
    [21.2, 'slap'], [21.5, 'slap'], [21.8, 'slap'], [22.0, 'star'], [22.1, 'slap'], [22.4, 'slap'], [22.7, 'slap'], [23.0, 'slap'], [23.3, 'slap'],
    [24.6, 'door'], [25.0, 'rev'], [25.4, 'skid'], [25.5, 'zoom'],
    [30.8, 'choir', { dur: 2.2 }], [44.2, 'bell'], [44.8, 'pop'], [46.2, 'bell'],
  ],
  lines: [
    { t: 4.6, who: 'bunty', text: 'Dekh Chintu... ab dekh PRO GAMER MOVE.', dur: 3.6 },
    { t: 8.4, who: 'chintu', text: 'Theek hai bhai, main lookout pe hoon!', dur: 3.0 },
    { t: 14.0, who: 'dadi', text: 'AE! Meri gaadi ko haath lagaya?!', style: 'shout', dur: 3.0 },
    { t: 17.2, who: 'bunty', text: 'D-Dadi ji... main toh bas iski dhool saaf kar raha tha!', dur: 3.8 },
    { t: 27.0, who: 'chintu', text: 'Bhai... Dadi ne humse better gaadi chalayi.', dur: 3.4 },
    { t: 33.2, who: 'bunty', text: 'Koi baat nahi! Asli SUPERCAR toh ye hai!', dur: 3.6 },
    { t: 37.0, who: 'chintu', text: 'Bhai... ye cycle hai.', dur: 2.6 },
    { t: 39.8, who: 'bunty', text: 'Haan. Aur iska engine... HUM hain!', dur: 3.8 },
  ],
  draw(ctx, t, S) {
    sky(ctx, t, 'day', { horizon: 600 });
    shopsRow(ctx, -400, GY - 40, t, { names: ['CHAI', 'PHONE', 'MITHAI', 'SALON', 'PIZZA', 'GYM'] });
    street(ctx, 0, t, { groundY: 800 });
    streetLamp(ctx, 120, GY - 10, { s: 1 });

    // bicycle hidden behind the car until it leaves
    const riding = t > 44.8;
    if (!riding) bicycle(ctx, BIKE_X, GY + 4, { s: 1.15 });
    if (t > 30.8 && t < 33) { const R = rng(9); for (let i = 0; i < 6; i++) sparkle(ctx, BIKE_X + (R() - 0.5) * 260, GY - 80 - R() * 150, 20 + R() * 16, Math.max(0, Math.sin((t - 30.8) * 5 + i))); }

    // Dadi: comes out of MITHAI shop, walks to Bunty, smacks, gets into the car
    const dadiOn = t > 13.4 && t < 24.6;
    const dx = keys(t, [[13.4, 1690], [15.6, 1060], [23.6, 1060], [24.6, CAR_X + 20]], ease.inOut);

    // car
    let carX = CAR_X;
    if (t > 25.4) carX = CAR_X + Math.pow(t - 25.4, 2) * 2200;
    const alarm = t > 13 && t < 17.4 && Math.floor(t * 6) % 2 === 0;
    if (carX < W + 800) {
      sportsCar(ctx, carX, GY + 6, { s: 1.7, alarm, wheelRot: t > 25.4 ? (t - 25.4) ** 2 * 60 : 0, driver: t > 24.6 ? c => {
        drawChar(c, 'dadi', { x: 30, y: -20, s: 0.62, t, legs: 'hidden', expr: 'smug', arms: 'hold' });
      } : null });
    }
    if (t > 25.3 && t < 27) { dust(ctx, CAR_X - 300, GY, t - 25.3, 2.0, 4, '#ddd'); dust(ctx, CAR_X - 100, GY, t - 25.45, 1.6, 5, '#eee'); }

    // wind spin after the car zooms away
    const spin = t > 25.6 && t < 26.8 ? Math.sin((t - 25.6) * 30) * 0.25 * (1 - (t - 25.6) / 1.2) : 0;

    // Chintu (lookout facing the wrong way)
    const cWalk = t > 33.5 && t < 36 ? t * 10 : undefined;
    const cX = keys(t, [[0, -300], [4.2, 380], [33.5, 380], [36, 1000]], ease.inOut);
    let cFace = -1, cArms = 'binoc', cExpr = 'normal';
    if (t < 4.2) { cFace = 1; cArms = 'tiptoe'; cExpr = 'worried'; }
    if (t > 26.8) { cFace = 1; cArms = t > 33.5 && t < 36 ? undefined : (t > 37 && t < 39.8 ? 'hips' : 'idle'); cExpr = t > 37 && t < 39.8 ? 'bored' : 'worried'; }
    if (t > 42.4) { cArms = 'facepalm'; }
    const cBino = cArms === 'binoc' ? c => { rr(c, -18, -14, 40, 28, 8); fs(c, '#333', 4); } : null;
    if (!riding) S.c(ctx, 'chintu', { x: cX, y: GY + 20, s: 1.3, face: cFace, arms: cArms, expr: cExpr, walk: t < 4.2 ? t * 7 : cWalk, prop: cBino, rot: spin, legs: t < 4.2 ? 'walk' : undefined });

    if (dadiOn) {
      const smacking = t > 21.1 && t < 23.6;
      S.c(ctx, 'dadi', { x: dx, y: GY + 30, s: 1.35, face: -1, walk: t < 15.6 || t > 23.6 ? t * 14 : undefined, arms: smacking ? 'smack' : (t < 21 ? 'hips' : 'idle'), expr: 'angry',
        prop: c => handbag(c, 0, 0, 0.9, smacking ? Math.sin(t * 18) * 0.6 : 0.2) });
    }

    // Bunty
    const bX = keys(t, [[0, -150], [4.4, 720], [11, 720], [12.4, 900], [33.2, 900], [34.6, 1150]], ease.inOut);
    let bArms, bExpr = 'smug', bWalk, bLegs, by = GY + 30, bFace = 1;
    if (t < 4.4) { bArms = 'tiptoe'; bWalk = t * 7; bLegs = 'walk'; by -= Math.abs(Math.sin(t * 3.5)) * 25; }
    else if (t < 11) { bArms = t > 4.6 && t < 8.2 ? 'point' : 'hips'; }
    else if (t < 12.4) { bArms = 'tiptoe'; bWalk = t * 7; bLegs = 'walk'; }
    else if (t < 13) { bArms = 'grab'; bExpr = 'smug'; }
    else if (t < 14) { bArms = 'up'; bExpr = 'shock'; by -= Math.sin(prog(13, 13.5, t) * Math.PI) * 80; }
    else if (t < 21.1) { bArms = 'up'; bExpr = 'scared'; bFace = t > 15.5 ? 1 : 1; }
    else if (t < 25.4) { bArms = 'flail'; bExpr = t < 23.6 ? 'dead' : 'scared'; }
    else if (t < 30.5) { bArms = 'idle'; bExpr = t < 27 ? 'shock' : 'sad'; }
    else if (t < 33.2) { bArms = 'idle'; bExpr = 'shock'; }
    else if (t < 34.6) { bWalk = t * 10; bExpr = 'smug'; }
    else if (t < 37) { bArms = 'point'; bExpr = 'laugh'; }
    else if (t < 39.8) { bArms = 'hips'; bExpr = 'smug'; }
    else { bArms = t < 42 ? 'cheer' : 'point'; bExpr = 'laugh'; }
    const bScale = 1.35;
    if (!riding) {
      // back away from Dadi a bit
      const back = t > 15.6 && t < 21.1 ? -40 * ease.inOut(prog(15.6, 16.4, t)) : 0;
      S.c(ctx, 'bunty', { x: bX + back, y: by, s: bScale, face: bFace, arms: bArms, expr: bExpr, walk: bWalk, legs: bLegs, rot: spin });
      if (t > 13 && t < 14.2) { txt(ctx, '!', bX + 40, by - 470, { size: 140, fill: '#ffd23f', lw: 14 }); }
      if (t > 21.1 && t < 26) dizzy(ctx, bX - 20 + back, by - 420, t, 1.3);
      if (t > 17.2 && t < 21) sweat(ctx, bX + 90 + back, by - 330, t, 1.3);
      if (t > 21.1 && t < 23.6) { const k = Math.floor((t - 21.1) / 0.3); pow(ctx, bX + 40 + (k % 2) * 60, by - 330 - (k % 3) * 30, ['SLAP!', 'DHISH!', 'THAP!'][k % 3], (t - 21.1) % 0.3 + 0.12, 0.75, '#ffd23f', k); }
    } else {
      const rx = keys(t, [[44.8, BIKE_X], [46, BIKE_X], [49.8, 2300]], ease.in);
      bikeRide(ctx, S, rx, GY + 30, { bs: 1.2, cs: 1.15, pedal: t * 9, wheelRot: (rx - BIKE_X) / 50, buntyExpr: 'laugh', chintuExpr: 'worried', rot: Math.sin(t * 6) * 0.03 });
      if (t < 45.6) dust(ctx, BIKE_X, GY + 20, t - 44.8, 1.5, 3, '#fff');
    }

    // HUD
    const stars = t > 22.0 ? 1 : 0;
    wanted(ctx, stars, t, 22.0); money(ctx, 0); minimap(ctx, t, { scroll: 40, cops: stars });
  },
  post(ctx, t) {
    chapterCard(ctx, 'CHAPTER 1', 'Gaadi Chori', t - 0.6, 3.2);
    popup(ctx, 'WANTED LEVEL UP: Dadi ko gussa dilaya', t - 22.1, 3.0);
    iris(ctx, ease.in(clamp((t - 49.2) / 0.8)), 1700, 700);
  },
};
