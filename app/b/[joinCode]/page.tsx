import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoardByJoinCode } from "@/lib/get-board-by-code";
import { isValidJoinCodeFormat } from "@/lib/utils";

// Short share link from PRD §6.1 step 3 (/b/ABCD12). Sends the owner to the management
// view and everyone else to the participant join flow.
export default async function ShortLinkPage({
  params,
}: {
  params: { joinCode: string };
}) {
  const joinCode = params.joinCode.toUpperCase();
  if (!isValidJoinCodeFormat(joinCode)) {
    notFound();
  }

  const board = await getBoardByJoinCode(joinCode);
  if (!board) {
    notFound();
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.id === board.owner_id) {
    redirect(`/board/${board.id}`);
  }

  redirect(`/join/${joinCode}`);
}
