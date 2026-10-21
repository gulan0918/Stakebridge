import { useCallback, useEffect, useRef, useState } from "react";
import { loadFile, loadWorkspace, saveWorkspace } from "./storage";
import type { Workspace } from "./model";
import { upgradeDefaultStages } from "../../journey";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const current = useRef<Workspace | null>(null);
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const pendingFiles = useRef(new Map<string, Blob>());
  const deletedFiles = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const write = writes.current
      .catch(() => {})
      .then(async () => {
        if (!current.current || revision.current === savedRevision.current)
          return;
        const snapshot = current.current;
        const snapshotRevision = revision.current;
        const files = new Map(pendingFiles.current);
        const deleted = new Set(deletedFiles.current);
        try {
          await saveWorkspace(snapshot, files, deleted);
          savedRevision.current = snapshotRevision;
          files.forEach((blob, id) => {
            if (pendingFiles.current.get(id) === blob)
              pendingFiles.current.delete(id);
          });
          deleted.forEach((id) => deletedFiles.current.delete(id));
          if (mounted.current && snapshotRevision === revision.current)
            setSaveState("saved");
        } catch (error) {
          if (mounted.current) setSaveState("error");
          throw error;
        }
      });
    writes.current = write;
    return write;
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    loadWorkspace()
      .then((loaded) => {
        if (!cancelled) {
          const stages = loaded && upgradeDefaultStages(loaded.stages);
          const next =
            loaded && stages !== loaded.stages
              ? { ...loaded, stages: stages! }
              : loaded;
          current.current = next;
          setWorkspace(next);
          setLoading(false);
          if (next !== loaded) {
            revision.current += 1;
            setSaveState("saving");
            void flush().catch(() => {});
          }
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Browser storage is unavailable.",
          );
          setLoading(false);
        }
      });
    const protectUnsaved = (event: BeforeUnloadEvent) => {
      if (revision.current !== savedRevision.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") void flush().catch(() => {});
    };
    window.addEventListener("beforeunload", protectUnsaved);
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      cancelled = true;
      mounted.current = false;
      void flush().catch(() => {});
      window.removeEventListener("beforeunload", protectUnsaved);
      document.removeEventListener("visibilitychange", saveWhenHidden);
    };
  }, [flush]);

  const change = useCallback(
    (
      update: Workspace | ((previous: Workspace) => Workspace),
      files: Map<string, Blob> = new Map(),
      deleted: string[] = [],
    ) => {
      const next =
        typeof update === "function"
          ? current.current && update(current.current)
          : update;
      if (!next) return;
      current.current = next;
      revision.current += 1;
      files.forEach((blob, id) => {
        pendingFiles.current.set(id, blob);
        deletedFiles.current.delete(id);
      });
      deleted.forEach((id) => {
        pendingFiles.current.delete(id);
        deletedFiles.current.add(id);
      });
      setWorkspace(next);
      setSaveState("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush().catch(() => {});
      }, 300);
    },
    [flush],
  );

  const getFile = useCallback(
    async (id: string) => pendingFiles.current.get(id) || loadFile(id),
    [],
  );
  return { workspace, loading, loadError, saveState, change, flush, getFile };
}

export type WorkspaceStore = ReturnType<typeof useWorkspace>;
