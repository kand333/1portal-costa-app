import type { InquiryMessage } from "@portal/shared/inquiry";
import { cn } from "@/lib/cn";

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });

/** Who reads the thread: their own messages go on the right. */
export type ThreadViewer = "admin" | "user";

type InquiryThreadProps = {
  viewer: ThreadViewer;
  /** The inquiry itself: the first message, always from the person who sent it. */
  inquiry: { name: string; message: string; createdAt: string };
  messages: InquiryMessage[];
};

type Bubble = { key: string; fromAdmin: boolean; author: string; body: string; createdAt: string };

/** Conversation after an inquiry, oldest first, as chat bubbles. */
export function InquiryThread({ viewer, inquiry, messages }: InquiryThreadProps) {
  const bubbles: Bubble[] = [
    { key: "inquiry", fromAdmin: false, author: inquiry.name, body: inquiry.message, createdAt: inquiry.createdAt },
    ...messages.map((message) => ({
      key: message.id,
      fromAdmin: message.fromAdmin,
      // The user sees the portal answering; ADMIN sees which administrator wrote it.
      author: message.fromAdmin
        ? viewer === "admin"
          ? (message.authorName ?? "Administrador")
          : "Portal Inmobiliario"
        : (message.authorName ?? inquiry.name),
      body: message.body,
      createdAt: message.createdAt,
    })),
  ];

  return (
    <ol aria-label="Conversación" className="space-y-4">
      {bubbles.map((bubble) => {
        const isOwn = bubble.fromAdmin === (viewer === "admin");
        return (
          <li key={bubble.key} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
            <article
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 shadow-soft sm:max-w-[75%]",
                isOwn ? "rounded-br-sm bg-accent text-on-accent" : "rounded-bl-sm border border-line bg-surface text-ink",
              )}
            >
              <header className={cn("flex flex-wrap items-baseline gap-x-2 text-xs", isOwn ? "text-on-accent/75" : "text-muted")}>
                <span className="font-semibold">{bubble.author}</span>
                <time dateTime={bubble.createdAt}>{dateTimeFormatter.format(new Date(bubble.createdAt))}</time>
              </header>
              <p className="mt-1 whitespace-pre-line break-words">{bubble.body}</p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
