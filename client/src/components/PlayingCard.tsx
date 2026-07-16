import { cn } from "@/lib/utils";
import type { WhiteCard } from "@xuuuxi/shared/types/cards";
import { Delete02Icon, Tick01Icon } from "hugeicons-react";

import { motion } from "motion/react";

interface PlayingCardProps {
  /** Single card (the common case). */
  card?: WhiteCard;
  /** Multiple cards rendered stacked in one frame (a pick-2 submission). */
  cards?: WhiteCard[];
  isSelected?: boolean;
  selectionIndex?: number;
  pickCount?: number;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  layoutId?: string;
  /** Optional footer label shown at the bottom of the card (e.g. player name). */
  meta?: React.ReactNode;
  /** Selection accent: default red accent, or destructive for discards. */
  selectionTone?: "accent" | "destructive";
}

export function PlayingCard({
  card,
  cards,
  isSelected,
  selectionIndex,
  pickCount = 1,
  onClick,
  className,
  disabled,
  layoutId,
  meta,
  selectionTone = "accent",
}: PlayingCardProps) {
  const contents = cards ?? (card ? [card] : []);
  const destructive = selectionTone === "destructive";

  return (
    <motion.div
      layoutId={layoutId}
      onClick={disabled ? undefined : onClick}
      whileTap={onClick && !disabled ? { scale: 0.97 } : undefined}
      className={cn(
        "game-card white",
        onClick && !disabled && "selectable",
        isSelected && "selected",
        isSelected && destructive && "selected-destructive",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        width: '100%',
        height: '100%',
        boxShadow: isSelected
          ? destructive
            ? "0 0 0 3px rgba(244, 67, 54, 0.2)"
            : "0 0 0 3px var(--accent-subtle)"
          : undefined,
      }}
    >
      <div className="card-text-stack">
        {contents.map((c, i) => (
          <div
            key={c.id}
            className="card-text"
            style={i > 0 ? { marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--card-white-border)' } : undefined}
          >
            {c.text}
          </div>
        ))}
      </div>
      {(isSelected || meta) && (
        <div
          className="card-meta"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: 'auto',
            color: isSelected && destructive ? 'var(--error)' : undefined,
          }}
        >
          {isSelected
            ? destructive
              ? <><Delete02Icon size={14} /> Descartar</>
              : pickCount > 1
                ? `#${(selectionIndex ?? 0) + 1}`
                : <><Tick01Icon size={14} /> Seleccionada</>
            : meta}
        </div>
      )}
    </motion.div>
  );
}
