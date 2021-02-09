import { useCallback, useEffect, useState } from "react";
import { TreeNode } from "roam-client";

export const useArrowKeyDown = <T>({
  results,
  onEnter,
}: {
  results: T[];
  onEnter: (i: T) => void;
}): {
  activeIndex: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
} => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        setActiveIndex((activeIndex + 1) % results.length);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setActiveIndex((activeIndex + results.length - 1) % results.length);
        e.preventDefault();
      } else if (e.key === "Enter" && results.length > 0) {
        onEnter(results[activeIndex]);
        e.preventDefault();
      }
    },
    [activeIndex, setActiveIndex, results, onEnter]
  );
  return {
    activeIndex,
    onKeyDown,
  };
};

export const useDocumentKeyDown = (
  eventListener: (e: KeyboardEvent) => void
): void =>
  useEffect(() => {
    document.addEventListener("keydown", eventListener);
    return () => document.removeEventListener("keydown", eventListener);
  }, [eventListener]);

export const getRenderRoot = (id: string): HTMLDivElement => {
  const app = document.getElementById("app");
  const newRoot = document.createElement("div");
  newRoot.id = `roamjs-${id}-root`;
  app.parentElement.appendChild(newRoot);
  return newRoot;
};

export const getSettingValueFromTree = ({
  tree,
  key,
  defaultValue = "",
}: {
  tree: TreeNode[];
  key: string;
  defaultValue?: string;
}): string => {
  const node = tree.find((s) => new RegExp(key, "i").test(s.text.trim()));
  const value = node ? node.children[0].text.trim() : defaultValue;
  return value;
};

export const API_URL =
  "https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production";
