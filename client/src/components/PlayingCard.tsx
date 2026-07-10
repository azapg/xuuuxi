import { cn } from "@/lib/utils";
import type { WhiteCard } from "@xuuuxi/shared/types/cards";
import { Tick01Icon } from "hugeicons-react";

import { motion } from "motion/react";

interface PlayingCardProps {
  card: WhiteCard;
  isSelected?: boolean;
  selectionIndex?: number;
  pickCount?: number;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  layoutId?: string;
}

export function PlayingCard({
  card,
  isSelected,
  selectionIndex,
  pickCount = 1,
  onClick,
  className,
  disabled,
  layoutId,
}: PlayingCardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "game-card white",
        !disabled && "selectable",
        isSelected && "selected",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        width: '100%', 
        height: '100%',
        boxShadow: isSelected ? "0 0 0 3px var(--accent-subtle)" : undefined,
      }}
    >
      <div className="card-text">{card.text}</div>
      {isSelected && (
        <div className="card-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 'auto' }}>
          {pickCount > 1 ? `#${(selectionIndex ?? 0) + 1}` : <><Tick01Icon size={14} /> Seleccionada</>}
        </div>
      )}
    </motion.div>
  );
}
