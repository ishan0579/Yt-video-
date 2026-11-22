// Composite rigs: riders on a bicycle etc.
import { bicycle } from './props.mjs';

// Bunty pedals, Chintu on the carrier. (x,y) = ground under the bike center.
export function bikeRide(ctx, S, x, y, o = {}) {
  const bs = o.bs ?? 0.8, t = S.t;
  const pedal = o.pedal ?? t * 8;
  ctx.save(); ctx.translate(x, y); if (o.rot) { ctx.translate(0, -80); ctx.rotate(o.rot); ctx.translate(0, 80); }
  const seatX = -20 * bs, seatY = -170 * bs;
  const sc = o.cs ?? 1.0;
  // Chintu on carrier (behind)
  if (o.chintu !== false) S.c(ctx, 'chintu', { x: -98 * bs, y: -125 * bs + 62 * 0.86 * sc - 4, s: sc, legs: 'sit', arms: o.chintuArms || 'hold', expr: o.chintuExpr || 'worried', ...(o.chintuO || {}) });
  bicycle(ctx, 0, 0, { s: bs, wheelRot: o.wheelRot ?? t * 6, pedal });
  S.c(ctx, 'bunty', { x: seatX + 4, y: seatY + 62 * sc - 6, s: sc, legs: 'pedal', pedal, arms: o.buntyArms || 'hold', expr: o.buntyExpr || 'smug', lean: 0.12, ...(o.buntyO || {}) });
  ctx.restore();
}
