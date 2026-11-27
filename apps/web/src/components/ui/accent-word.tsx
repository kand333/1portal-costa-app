import type { ReactNode } from "react";

type AccentWordProps = {
  children: ReactNode;
  /** Italic only, no orange: for headlines on a blue background, where the orange text would not pass contrast. */
  plain?: boolean;
};

/** The key word of a headline: a light italic, orange by default, against the heavy upright text around it. */
export function AccentWord({ children, plain = false }: AccentWordProps) {
  return <em className={plain ? "display-accent-plain" : "display-accent"}>{children}</em>;
}
