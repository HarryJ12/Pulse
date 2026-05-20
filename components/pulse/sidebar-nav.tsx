"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  MessagesSquare,
  FolderKanban,
  Home,
  MessageSquareText,
  UserCircle,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/threads", label: "Threads", icon: MessageSquareText },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/meeting", label: "Call Room", icon: Video },
  { href: "/weekly-pulse", label: "Weekly Pulse", icon: Activity },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

type SidebarNavProps = {
  currentUserId: string;
};

function chatSeenStorageKey(userId: string) {
  return `pulse:last_seen_chat_at:${userId}`;
}

export function SidebarNav({ currentUserId }: SidebarNavProps) {
  const pathname = usePathname();
  const [hasChatMention, setHasChatMention] = useState(false);
  const isChatActive = pathname.startsWith("/chat");

  const checkChatMentions = useCallback(async () => {
    if (!currentUserId) return;

    const lastSeen = window.localStorage.getItem(chatSeenStorageKey(currentUserId));
    const params = new URLSearchParams();
    if (lastSeen) params.set("lastSeen", lastSeen);

    try {
      const response = await fetch(`/api/chat-mentions?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok || !response.headers.get("content-type")?.includes("json")) {
        return;
      }

      const result = (await response.json()) as { hasMention?: boolean };
      setHasChatMention(Boolean(result.hasMention));
    } catch {
      setHasChatMention(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    if (isChatActive) {
      window.localStorage.setItem(
        chatSeenStorageKey(currentUserId),
        new Date().toISOString(),
      );
      setHasChatMention(false);
      return;
    }

    void checkChatMentions();
  }, [checkChatMentions, currentUserId, isChatActive, pathname]);

  useEffect(() => {
    if (!currentUserId || isChatActive) return;

    function handleFocus() {
      void checkChatMentions();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [checkChatMentions, currentUserId, isChatActive]);

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "pulse-focus flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-[background,color,transform] duration-150 ease-[var(--ease-standard)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
              isActive &&
                "bg-[var(--accent-muted)] text-[var(--accent-strong)]",
            )}
          >
            <span className="relative flex size-4 items-center justify-center">
              <Icon className="size-4" aria-hidden="true" />
              {link.href === "/chat" && hasChatMention && !isActive ? (
                <span
                  className="absolute -right-1 -top-1 size-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface)]"
                  aria-hidden="true"
                />
              ) : null}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
