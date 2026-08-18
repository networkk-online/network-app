import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Play, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SharedPostPreview {
  id: string;
  thumbnailUrl?: string | null;
  creatorName: string;
  creatorAvatar?: string | null;
  caption?: string | null;
  isVideo?: boolean;
  isVerified?: boolean;
}

export interface StoryTransform {
  /** normalized center X (0..1 of container width) */
  x: number;
  /** normalized center Y (0..1 of container height) */
  y: number;
  /** multiplier applied on top of the base card width */
  scale: number;
  /** degrees */
  rotation: number;
}

export const DEFAULT_STORY_TRANSFORM: StoryTransform = {
  x: 0.5,
  y: 0.62,
  scale: 1,
  rotation: 0,
};

const MIN_SCALE = 0.45;
const MAX_SCALE = 2.6;
/** card base width as a fraction of the story canvas width */
const BASE_WIDTH_RATIO = 0.72;
/** how far outside the canvas the card centre may travel */
const EDGE_MARGIN = 0.12;

export const clampTransform = (t: StoryTransform): StoryTransform => ({
  x: Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, t.x)),
  y: Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, t.y)),
  scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale)),
  rotation: t.rotation,
});

export const parseStoryTransform = (raw: unknown): StoryTransform => {
  if (!raw || typeof raw !== 'object') return DEFAULT_STORY_TRANSFORM;
  const r = raw as Partial<StoryTransform>;
  return clampTransform({
    x: Number.isFinite(r.x) ? Number(r.x) : DEFAULT_STORY_TRANSFORM.x,
    y: Number.isFinite(r.y) ? Number(r.y) : DEFAULT_STORY_TRANSFORM.y,
    scale: Number.isFinite(r.scale) ? Number(r.scale) : 1,
    rotation: Number.isFinite(r.rotation) ? Number(r.rotation) : 0,
  });
};

/* ------------------------------------------------------------------ */
/* Visual card (shared between editor and viewer)                      */
/* ------------------------------------------------------------------ */

export const SharedPostCardVisual = ({ post }: { post: SharedPostPreview }) => (
  <div
    dir="rtl"
    className="w-full rounded-2xl border border-white/20 bg-black/60 p-3 shadow-2xl backdrop-blur-xl"
    style={{ WebkitBackdropFilter: 'blur(24px)' }}
  >
    <div className="mb-2 flex items-center gap-2">
      {post.creatorAvatar ? (
        <img
          src={post.creatorAvatar}
          alt=""
          draggable={false}
          className="h-7 w-7 rounded-full border border-white/20 object-cover"
        />
      ) : (
        <div className="h-7 w-7 rounded-full bg-white/10" />
      )}
      <span className="truncate text-sm font-medium text-white">@{post.creatorName}</span>
      {post.isVerified && (
        <span className="inline-block h-3.5 w-3.5 rounded-full bg-[#08A045]" aria-hidden />
      )}
    </div>

    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/10">
      {post.thumbnailUrl ? (
        <img
          src={post.thumbnailUrl}
          alt=""
          draggable={false}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-8 w-8 text-white/40" />
        </div>
      )}
      {post.isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Play className="h-8 w-8 fill-white text-white" />
        </div>
      )}
    </div>

    {post.caption && (
      <p className="mt-2 line-clamp-2 text-right text-xs text-white/80">{post.caption}</p>
    )}
    <p className="mt-1 text-right text-[10px] font-semibold tracking-wide text-white/50">
      Networkk
    </p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Editable sticker with drag / pinch / rotate                         */
/* ------------------------------------------------------------------ */

interface EditableProps {
  post: SharedPostPreview;
  containerRef: React.RefObject<HTMLElement>;
  initial?: StoryTransform;
  /** called on gesture end only (never during the gesture) */
  onCommit: (t: StoryTransform) => void;
}

export const SharedPostSticker = ({ post, containerRef, initial, onCommit }: EditableProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<StoryTransform>(clampTransform(initial ?? DEFAULT_STORY_TRANSFORM));
  const rafRef = useRef<number | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startTransform: StoryTransform;
    startCenter: { x: number; y: number };
    startDist: number;
    startAngle: number;
    multi: boolean;
  } | null>(null);
  const lastTapRef = useRef(0);
  const [active, setActive] = useState(false);

  const rect = () => containerRef.current?.getBoundingClientRect();

  const paint = useCallback(() => {
    rafRef.current = null;
    const node = nodeRef.current;
    const r = rect();
    if (!node || !r) return;
    const t = transformRef.current;
    node.style.transform = `translate3d(${t.x * r.width}px, ${t.y * r.height}px, 0) translate(-50%, -50%) rotate(${t.rotation}deg) scale(${t.scale})`;
  }, [containerRef]);

  const schedule = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(paint);
  }, [paint]);

  useLayoutEffect(() => {
    paint();
    const onResize = () => paint();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [paint]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  const pointerStats = () => {
    const pts = Array.from(pointers.current.values());
    if (pts.length === 1) {
      return { center: pts[0], dist: 0, angle: 0 };
    }
    const [a, b] = pts;
    return {
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    };
  };

  const beginGesture = () => {
    const s = pointerStats();
    gesture.current = {
      startTransform: { ...transformRef.current },
      startCenter: s.center,
      startDist: s.dist,
      startAngle: s.angle,
      multi: pointers.current.size > 1,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (pointers.current.size >= 2) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    beginGesture();
    setActive(true);
    e.stopPropagation();
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = rect();
    if (!r) return;

    const g = gesture.current;
    const s = pointerStats();
    const next: StoryTransform = { ...g.startTransform };

    next.x = g.startTransform.x + (s.center.x - g.startCenter.x) / r.width;
    next.y = g.startTransform.y + (s.center.y - g.startCenter.y) / r.height;

    if (g.multi && g.startDist > 0 && pointers.current.size > 1) {
      next.scale = g.startTransform.scale * (s.dist / g.startDist);
      let delta = s.angle - g.startAngle;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      next.rotation = g.startTransform.rotation + delta;
    }

    transformRef.current = clampTransform(next);
    schedule();
    e.stopPropagation();
    e.preventDefault();
  };

  const endPointer = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    if (pointers.current.size > 0) {
      // re-baseline so the remaining finger doesn't jump
      beginGesture();
      return;
    }
    gesture.current = null;
    setActive(false);
    onCommit({ ...transformRef.current });

    // double tap → reset
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      transformRef.current = { ...DEFAULT_STORY_TRANSFORM };
      schedule();
      onCommit({ ...DEFAULT_STORY_TRANSFORM });
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
    e.stopPropagation();
  };

  return (
    <div
      ref={nodeRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'absolute left-0 top-0 z-30 cursor-grab select-none touch-none will-change-transform',
        active && 'cursor-grabbing',
      )}
      style={{
        width: `${BASE_WIDTH_RATIO * 100}%`,
        maxWidth: 380,
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div className={cn('transition-shadow', active && 'drop-shadow-[0_0_18px_rgba(8,160,69,0.45)]')}>
        <SharedPostCardVisual post={post} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Read-only overlay for the story viewer                              */
/* ------------------------------------------------------------------ */

export const SharedPostOverlay = ({
  post,
  transform,
  onOpen,
}: {
  post: SharedPostPreview;
  transform: StoryTransform;
  onOpen: () => void;
}) => {
  const t = clampTransform(transform);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className="absolute z-20 text-left"
      style={{
        width: `${BASE_WIDTH_RATIO * 100}%`,
        maxWidth: 380,
        left: `${t.x * 100}%`,
        top: `${t.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${t.rotation}deg) scale(${t.scale})`,
      }}
    >
      <SharedPostCardVisual post={post} />
    </button>
  );
};

