"use client";

import {
  animate,
  type AnimationPlaybackControls,
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useSpring,
} from "motion/react";
import {
  Children,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { cn } from "@/lib/utils";

const GLIDE_SPRING = { stiffness: 40, damping: 20, mass: 3 };
const FLICK_MOMENTUM = 0.45;
const MAX_FLICK_ITEMS = 6;

export interface CylinderCarouselProps {
  children: ReactNode;
  itemSize?: number;
  visibleItems?: number;
  variant?: "concave" | "convex";
  minScale?: number;
  dragSpeed?: number;
  arc?: number;
  snap?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  height?: number;
  className?: string;
}

const THETA_EDGE = (72 * Math.PI) / 180;
const THETA_CLAMP = (95 * Math.PI) / 180;

function CarouselBall({
  scroll,
  index,
  count,
  alpha,
  k,
  projection,
  gap,
  edgeOffset,
  minScale,
  convex,
  arc,
  halfWidth,
  itemSize,
  canScroll,
  hoverIdx,
  children,
}: {
  scroll: MotionValue<number>;
  index: number;
  count: number;
  alpha: number;
  k: number;
  projection: number;
  gap: number;
  edgeOffset: number;
  minScale: number;
  convex: boolean;
  arc: number;
  halfWidth: number;
  itemSize: number;
  canScroll: boolean;
  hoverIdx: MotionValue<number>;
  children: ReactNode;
}) {
  const offset = useTransform(scroll, (s) => {
    let o = index - s;
    if (canScroll) {
      o -= Math.round(o / count) * count;
    }
    return o;
  });
  
  // Springy hover effects!
  const hDist = useTransform(hoverIdx, (h) => h === -1 ? -1 : (index - h));
  
  // When distance is 0 (hovered), scale 1.15. Adjacent get slight bump.
  const scaleHover = useTransform(hDist, (d) => {
    if (d === -1) return 0;
    const abs = Math.abs(d);
    return (abs === 0 ? 0.2 : (abs === 1 ? 0.05 : 0)) as number;
  });
  
  // When distance is 0, move UP significantly. Adjacent move up slightly.
  const yHover = useTransform(hDist, (d) => {
    if (d === -1) return 0;
    const abs = Math.abs(d);
    return (abs === 0 ? -40 : (abs === 1 ? -10 : 0)) as number;
  });
  
  // Adjacent cards move SIDEWAYS to make room
  const xHover = useTransform(hDist, (d) => {
    if (d === -1) return 0;
    if (d === 0) return 0;
    return (d > 0 ? 25 : -25) as number; // Push right if greater index, left if smaller
  });

  const scaleHoverSpring = useSpring(scaleHover, { stiffness: 400, damping: 15 });
  const yHoverSpring = useSpring(yHover, { stiffness: 400, damping: 15 });
  const xHoverSpring = useSpring(xHover, { stiffness: 400, damping: 15 });

  const xBase = useTransform(offset, (o) => {
    if (convex) return o * gap;
    const th = Math.max(-THETA_CLAMP, Math.min(THETA_CLAMP, o * alpha));
    return (projection * Math.sin(th)) / (Math.cos(th) + k);
  });

  const yBase = useTransform(xBase, (px) => {
    const t = px / halfWidth;
    const valley = arc * (0.5 - t * t);
    return convex ? -valley : valley;
  });

  const scaleBase = useTransform(offset, (o) => {
    const t = Math.min(Math.abs(o) / edgeOffset, THETA_CLAMP / THETA_EDGE);
    return convex
      ? 1 - (1 - minScale) * t
      : minScale + (1 - minScale) * t;
  });

  // Fan out slightly on the Z axis, but clamp it to max 15 degrees so it doesn't look completely sideways on large screens
  const rotateZBase = useTransform(offset, (o) => {
    const rot = o * 4;
    return Math.max(-15, Math.min(15, rot));
  });

  const visibility = useTransform(offset, (o) => {
    return Math.abs(o) > edgeOffset + 1 ? "hidden" : "visible";
  });
  
  // Combine base values with hover springs
  const x = useTransform([xBase, xHoverSpring], ([base, hover]) => (base as number) + (hover as number));
  const y = useTransform([yBase, yHoverSpring], ([base, hover]) => (base as number) + (hover as number));
  const scale = useTransform([scaleBase, scaleHoverSpring], ([base, hover]) => (base as number) + (hover as number));
  const rotateZ = useTransform([rotateZBase, hoverIdx], ([base, h]) => h === index ? 0 : base as number);
  
  const zIndex = useTransform([offset, hDist], ([o, h]) => {
    if (h === 0) return 1000;
    return 100 - Math.round(Math.abs(o as number) * 10);
  });

  return (
    <motion.div
      onMouseEnter={() => hoverIdx.set(index)}
      onMouseLeave={() => hoverIdx.set(-1)}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        x,
        y,
        scale,
        rotateZ,
        visibility,
        width: itemSize,
        height: itemSize * 1.5, // Taller cards
        marginLeft: -itemSize / 2,
        marginTop: -(itemSize * 1.5) / 2,
        zIndex
      }}
    >
      {children}
    </motion.div>
  );
}

export function CylinderCarousel({
  children,
  itemSize = 180, // Default width for a card
  visibleItems = 5, // We will override this based on screen size
  variant = "convex", // Defaulting to convex as requested
  minScale = 0.9,
  dragSpeed = 1.5,
  arc: arcProp,
  snap = true,
  autoRotate = false,
  autoRotateSpeed = 0.4,
  defaultIndex = 0,
  onIndexChange,
  height,
  className,
}: CylinderCarouselProps) {
  const reduce = useReducedMotion() ?? false;
  const items = Children.toArray(children);
  const count = items.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stageWidth = width || 800;
  const halfWidth = stageWidth / 2;
  
  // Dynamic visible items based on screen width so they fit properly
  // Using 1.1 ensures that items have breathing room and don't shrink aggressively
  const actualVisibleItems = width > 0 ? Math.max(3, Math.min(count, Math.floor(width / (itemSize * 1.1)))) : visibleItems;
  const edgeOffset = (actualVisibleItems + 1) / 2;

  const convex = variant === "convex";
  const size = itemSize;
  const gap = size * 0.7; // Fixed proportional gap for consistent spacing on all devices
  const arc = arcProp ?? size * 0.35;

  const canScroll = count > 0 && ((count - 1) * gap + itemSize > stageWidth);

  const alpha = THETA_EDGE / edgeOffset;
  const k = Math.max(0.2, (minScale - Math.cos(THETA_EDGE)) / (1 - minScale));
  const projection =
    (halfWidth * (Math.cos(THETA_EDGE) + k)) / Math.sin(THETA_EDGE);

  const scroll = useMotionValue(defaultIndex);
  const indexRef = useRef(defaultIndex);
  const [, setActiveIndex] = useState(defaultIndex);
  const glideRef = useRef<AnimationPlaybackControls | null>(null);
  const draggingRef = useRef(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    if (count === 0) return;
    const unsub = scroll.on("change", (v) => {
      const idx = ((Math.round(v) % count) + count) % count;
      if (idx !== indexRef.current) {
        indexRef.current = idx;
        setActiveIndex(idx);
        onIndexChange?.(idx);
      }
    });
    return unsub;
  }, [scroll, count, onIndexChange]);

  const stopGlide = useCallback(() => {
    glideRef.current?.stop();
    glideRef.current = null;
  }, []);

  const glideTo = useCallback(
    (to: number, velocity: number) => {
      stopGlide();
      if (reduce) {
        scroll.set(to);
        return;
      }
      glideRef.current = animate(scroll, to, {
        type: "spring",
        ...GLIDE_SPRING,
        velocity,
        restDelta: 0.001,
        restSpeed: 0.005,
      });
    },
    [scroll, stopGlide, reduce],
  );

  const settle = useCallback(
    (velocity: number) => {
      const projected =
        scroll.get() +
        Math.max(
          -MAX_FLICK_ITEMS,
          Math.min(MAX_FLICK_ITEMS, velocity * FLICK_MOMENTUM),
        );
      glideTo(snap ? Math.round(projected) : projected, velocity);
    },
    [scroll, snap, glideTo],
  );

  const drag = useRef({
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    prevX: 0,
    prevT: 0,
  });

  const hoverIdx = useMotionValue(-1);

  useEffect(() => {
    if (!canScroll) {
      scroll.set((count - 1) / 2);
    }
  }, [canScroll, count, scroll]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!canScroll) return;
      stopGlide();
      draggingRef.current = true;
      // Removed setPointerCapture to allow child clicks to fire properly
      const now = performance.now();
      drag.current = {
        startX: e.clientX,
        startScroll: scroll.get(),
        lastX: e.clientX,
        lastT: now,
        prevX: e.clientX,
        prevT: now,
      };
    },
    [scroll, stopGlide, canScroll],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!draggingRef.current || !canScroll) return;
      const d = drag.current;
      scroll.set(d.startScroll - ((e.clientX - d.startX) * dragSpeed) / gap);
      d.prevX = d.lastX;
      d.prevT = d.lastT;
      d.lastX = e.clientX;
      d.lastT = performance.now();
    },
    [scroll, gap, dragSpeed, canScroll],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (!draggingRef.current || !canScroll) return;
      draggingRef.current = false;
      const d = drag.current;
      const dt = d.lastT - d.prevT;
      const vpx = dt > 0 ? (d.lastX - d.prevX) / dt : 0;
      
      // If we barely moved, it's a click! Let it bubble down to children.
      const moveDistance = Math.abs(e.clientX - d.startX);
      if (moveDistance < 5) {
        // Just settle immediately, it was a click
        settle(0);
        return;
      }

      settle((-vpx * dragSpeed * 1000) / gap);
    },
    [settle, gap, dragSpeed, canScroll],
  );

  const rollBy = useCallback(
    (dir: number) => {
      if (!canScroll) return;
      glideTo(Math.round(scroll.get()) + dir, scroll.getVelocity());
    },
    [scroll, glideTo, canScroll],
  );

  const wheelSettleRef = useRef<number | undefined>(undefined);
  const onWheel = useCallback(
    (e: ReactWheelEvent) => {
      if (!canScroll) return;
      stopGlide();
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      scroll.set(scroll.get() + delta / gap);
      if (wheelSettleRef.current) window.clearTimeout(wheelSettleRef.current);
      wheelSettleRef.current = window.setTimeout(
        () => settle(scroll.getVelocity()),
        140,
      );
    },
    [scroll, gap, settle, stopGlide, canScroll],
  );

  const stageHeight = height ?? size * 1.6;

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: custom draggable + keyboard carousel */}
      <div
        ref={stageRef}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable custom carousel widget
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            rollBy(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            rollBy(-1);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onPointerEnter={() => {
          hoverRef.current = true;
        }}
        onPointerLeave={() => {
          hoverRef.current = false;
        }}
        onClickCapture={(e) => {
          if (!canScroll) return;
          const moveDistance = Math.abs(drag.current.lastX - drag.current.startX);
          if (moveDistance > 5) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        className={cn(
          "cylinder-carousel-container",
          className,
        )}
        style={{ 
          height: stageHeight, 
          overflow: 'visible', // Removed clipPath to prevent cropping
          position: 'relative',
          width: '100%',
          touchAction: 'none',
          userSelect: 'none',
          outline: 'none',
          cursor: canScroll ? (draggingRef.current ? 'grabbing' : 'grab') : 'default',
          perspective: 1200,
          transformStyle: 'preserve-3d'
        }}
      >
        {items.map((item, i) => (
          <CarouselBall
            // biome-ignore lint/suspicious/noArrayIndexKey: slides are positional and stable
            key={i}
            scroll={scroll}
            index={i}
            count={count}
            alpha={alpha}
            k={k}
            projection={projection}
            gap={gap}
            edgeOffset={edgeOffset}
            minScale={minScale}
            convex={convex}
            arc={arc}
            halfWidth={halfWidth}
            itemSize={size}
            canScroll={canScroll}
            hoverIdx={hoverIdx}
          >
            {item}
          </CarouselBall>
        ))}
      </div>
    </>
  );
}
