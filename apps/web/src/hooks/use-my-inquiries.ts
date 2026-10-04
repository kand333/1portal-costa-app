"use client";

import type { UserInquiry } from "@portal/shared/inquiry";
import useSWR from "swr";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchJson } from "@/lib/api-client";
import { MY_INQUIRIES_KEY } from "@/lib/inquiry-submission";

/** Inquiries sent by the logged-in user (no request for visitors). */
export function useMyInquiries() {
  const { data: currentUser } = useCurrentUser();
  return useSWR<UserInquiry[], Error>(currentUser ? MY_INQUIRIES_KEY : null, fetchJson);
}
