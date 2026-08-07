"use client";

import { AppShell } from "@/components/AppShell";
import { ListsView } from "@/components/ListsView";
import { useLists } from "@/hooks/useLists";

export function ListsClient() {
  return (
    <AppShell showFilter={false}>
      {({ workspaceId, me }) => (
        <ListsInner workspaceId={workspaceId} me={me} />
      )}
    </AppShell>
  );
}

function ListsInner({
  workspaceId,
  me,
}: {
  workspaceId: string | null;
  me: "a" | "b";
}) {
  const listsApi = useLists({ workspaceId, me });

  return (
    <ListsView
      lists={listsApi.lists}
      items={listsApi.items}
      me={me}
      needsMigration={listsApi.needsMigration}
      onCreate={listsApi.createList}
      onDeleteList={listsApi.deleteList}
      onAddItem={listsApi.addItem}
      onAddItems={listsApi.addItems}
      onToggleItem={listsApi.toggleItem}
      onDeleteItem={listsApi.deleteItem}
      onClearDone={listsApi.clearDone}
    />
  );
}
