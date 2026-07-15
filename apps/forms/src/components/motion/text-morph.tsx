"use client";

// Adapted from Cnippet's Text Morph component published on 21st.dev.
import { AnimatePresence, motion, type Transition, type Variants } from "motion/react";
import { useId, useMemo, type CSSProperties, type ElementType } from "react";

export type TextMorphProps = {
  children: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  variants?: Variants;
  transition?: Transition;
};

const defaultVariants: Variants = {
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  initial: { opacity: 0 },
};

const defaultTransition: Transition = {
  damping: 18,
  mass: 0.3,
  stiffness: 280,
  type: "spring",
};

export function TextMorph({
  children,
  as: Component = "p",
  className,
  style,
  variants,
  transition,
}: TextMorphProps) {
  const uniqueId = useId();
  const characters = useMemo(() => {
    const counts: Record<string, number> = {};
    return children.split("").map((character) => {
      const key = character.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
      return { id: `${uniqueId}-${key}${counts[key]}`, label: character === " " ? " " : character };
    });
  }, [children, uniqueId]);

  return (
    <Component aria-label={children} className={className} style={style}>
      <AnimatePresence initial={false} mode="popLayout">
        {characters.map((character) => (
          <motion.span
            animate="animate"
            aria-hidden="true"
            exit="exit"
            initial="initial"
            key={character.id}
            layoutId={character.id}
            style={{ display: "inline-block" }}
            transition={transition ?? defaultTransition}
            variants={variants ?? defaultVariants}
          >
            {character.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </Component>
  );
}
