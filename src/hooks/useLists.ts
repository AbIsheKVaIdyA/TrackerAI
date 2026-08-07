"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import type { PartnerId } from "@/lib/types";

export type ListKind = "checklist" | "groceries" | "chores" | "other";

export interface SharedList {
  id: string;
  workspaceId: string;
  title: string;
  kind: ListKind;
  createdBy: PartnerId;
  createdAt: string;
  updatedAt?: string;
}

export interface ListItem {
  id: string;
  listId: string;
  workspaceId: string;
  title: string;
  done: boolean;
  sortOrder: number;
  createdBy: PartnerId;
  createdAt: string;
}

interface ListRow {
  id: string;
  workspace_id: string;
  title: string;
  kind: ListKind;
  created_by: PartnerId;
  created_at: string;
  updated_at?: string | null;
}

interface ItemRow {
  id: string;
  list_id: string;
  workspace_id: string;
  title: string;
  done: boolean;
  sort_order: number;
  created_by: PartnerId;
  created_at: string;
}

function rowToList(row: ListRow): SharedList {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    kind: row.kind,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function rowToItem(row: ItemRow): ListItem {
  return {
    id: row.id,
    listId: row.list_id,
    workspaceId: row.workspace_id,
    title: row.title,
    done: row.done,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function useLists(opts: {
  workspaceId?: string | null;
  me?: PartnerId | null;
}) {
  const { workspaceId, me } = opts;
  const [lists, setLists] = useState<SharedList[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setLists([]);
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });

      if (listError) {
        if (
          listError.message?.includes("does not exist") ||
          listError.code === "42P01" ||
          listError.message?.includes("schema cache")
        ) {
          setNeedsMigration(true);
        }
        setLists([]);
        setItems([]);
        return;
      }

      setNeedsMigration(false);
      setLists(((listData as ListRow[]) ?? []).map(rowToList));

      const { data: itemData, error: itemError } = await supabase
        .from("list_items")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (itemError) {
        setItems([]);
        return;
      }
      setItems(((itemData as ItemRow[]) ?? []).map(rowToItem));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!workspaceId) return;
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`lists-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        () => void refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "list_items" },
        () => void refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, refresh]);

  const createList = useCallback(
    async (input: { title: string; kind?: ListKind }) => {
      if (!workspaceId || !me) throw new Error("Not in a workspace");
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("lists")
        .insert({
          workspace_id: workspaceId,
          title: input.title.trim() || "List",
          kind: input.kind ?? "checklist",
          created_by: me,
        })
        .select()
        .single();
      if (error) throw error;
      const list = rowToList(data as ListRow);
      setLists((prev) => [list, ...prev]);
      return list;
    },
    [workspaceId, me]
  );

  const renameList = useCallback(async (id: string, title: string) => {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("lists")
      .update({ title: title.trim(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const list = rowToList(data as ListRow);
    setLists((prev) => prev.map((l) => (l.id === id ? list : l)));
  }, []);

  const deleteList = useCallback(async (id: string) => {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) throw error;
    setLists((prev) => prev.filter((l) => l.id !== id));
    setItems((prev) => prev.filter((i) => i.listId !== id));
  }, []);

  const addItems = useCallback(
    async (listId: string, titles: string[]) => {
      if (!workspaceId || !me) throw new Error("Not in a workspace");
      const cleaned = titles.map((t) => t.trim()).filter(Boolean);
      if (cleaned.length === 0) return [];
      const maxOrder = items
        .filter((i) => i.listId === listId)
        .reduce((m, i) => Math.max(m, i.sortOrder), 0);
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("list_items")
        .insert(
          cleaned.map((title, idx) => ({
            list_id: listId,
            workspace_id: workspaceId,
            title,
            done: false,
            sort_order: maxOrder + 1 + idx,
            created_by: me,
          }))
        )
        .select();
      if (error) throw error;
      const added = ((data as ItemRow[]) ?? []).map(rowToItem);
      setItems((prev) => [...prev, ...added]);
      await supabase
        .from("lists")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", listId);
      return added;
    },
    [workspaceId, me, items]
  );

  const addItem = useCallback(
    async (listId: string, title: string) => {
      const [item] = await addItems(listId, [title]);
      return item ?? null;
    },
    [addItems]
  );

  const toggleItem = useCallback(async (id: string, done: boolean) => {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("list_items")
      .update({ done, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const item = rowToItem(data as ItemRow);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("list_items").delete().eq("id", id);
    if (error) throw error;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearDone = useCallback(async (listId: string) => {
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", listId)
      .eq("done", true);
    if (error) throw error;
    setItems((prev) =>
      prev.filter((i) => !(i.listId === listId && i.done))
    );
  }, []);

  return {
    lists,
    items,
    loading,
    needsMigration,
    refresh,
    createList,
    renameList,
    deleteList,
    addItem,
    addItems,
    toggleItem,
    deleteItem,
    clearDone,
  };
}
