import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBoardForm } from "@/components/board/CreateBoardForm";
import { BoardListItem } from "@/components/board/BoardListItem";
import { LogoutButton } from "@/components/LogoutButton";
import type { Board } from "@/lib/types";

const FACILITATOR_NAME_KEY = "ideawall:facilitator:name";

export default async function BoardsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const facilitatorName = "Fasilitator";
    const boards = [] as Board[];

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Boards</h1>
            <p className="text-sm text-slate-500">{facilitatorName}</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CreateBoardForm />
        </div>

        <p className="text-sm text-slate-500">
          Belum ada board. Buat board pertama kamu di atas.
        </p>
      </main>
    );
  }

  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const boardList = (boards ?? []) as Board[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Boards</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CreateBoardForm />
      </div>

      {boardList.length === 0 ? (
        <p className="text-sm text-slate-500">
          Belum ada board. Buat board pertama kamu di atas.
        </p>
      ) : (
        <ul className="space-y-3">
          {boardList.map((board) => (
            <BoardListItem key={board.id} board={board} />
          ))}
        </ul>
      )}
    </main>
  );
}
