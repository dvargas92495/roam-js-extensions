import userEvent from "@testing-library/user-event";
import { asyncType } from "roam-client";
import { createObserver } from "../entry-helpers";

const TODONT_CLASSNAME = "roamjs-todont";
const css = document.createElement("link");
css.type = "text/css";
css.rel = "stylesheet";
css.innerText = `
  .${TODONT_CLASSNAME} {
    background-color: red !important;
    borderRadius: 0;
    padding: 0;
    minHeight: 0;
    minWidth: 0;
    height: 16px;
  }
`;

const styleArchivedButtons = (node: HTMLElement) => {
  const buttons = node.getElementsByTagName("button");
  Array.from(buttons).forEach((button) => {
    if (
      button.innerText === "ARCHIVED" &&
      button.className.indexOf(TODONT_CLASSNAME) < 0
    ) {
      button.innerText = "x";
      button.className = `${button.className} ${TODONT_CLASSNAME}`;
    }
  });
};
styleArchivedButtons(document.body);

createObserver((mutationList: MutationRecord[]) => {
  mutationList.forEach((record) => {
    styleArchivedButtons(record.target as HTMLElement);
  });
});

const resetCursor = (inputStart: number, inputEnd: number) => {
  const textArea = document.activeElement as HTMLTextAreaElement;
  const start = Math.max(0, inputStart);
  const end = Math.max(0, inputEnd);

  // hack to reset cursor in original location
  setTimeout(() => textArea.setSelectionRange(start, end), 1);
};

const keydownEventListener = async (e: KeyboardEvent) => {
  if (
    e.key === "Enter" &&
    e.shiftKey &&
    e.ctrlKey &&
    document.activeElement.tagName === "TEXTAREA"
  ) {
    const textArea = document.activeElement as HTMLTextAreaElement;
    const value = textArea.value;
    const oldStart = textArea.selectionStart;
    const oldEnd = textArea.selectionEnd;
    if (value.startsWith("{{[[TODO]]}}") || value.startsWith("{{[[DONE]]}}")) {
      textArea.setSelectionRange(4, 8);
      await asyncType("{backspace}");
      await asyncType("ARCHIVED");
      resetCursor(oldStart + 4, oldEnd + 4);
    } else if (value.startsWith("{{[[ARCHIVED]]}}")) {
      const afterArchive = value.substring(16).trim();
      const end = afterArchive ? value.indexOf(afterArchive) : value.length;
      textArea.setSelectionRange(0, end);
      await asyncType("{backspace}");
      resetCursor(oldStart - end, oldEnd - end);
    } else {
      textArea.setSelectionRange(0, 0);
      await userEvent.type(textArea, "{{[[ARCHIVED]]}} ", {
        initialSelectionStart: 0,
        initialSelectionEnd: 0,
      });
      resetCursor(oldStart + 17, oldEnd + 17);
    }
  }
};

document.addEventListener("keydown", keydownEventListener);
