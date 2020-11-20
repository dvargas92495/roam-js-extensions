import userEvent from "@testing-library/user-event";
import { asyncType } from "roam-client";
import { createMobileIcon, createObserver, runExtension } from "../entry-helpers";

runExtension("todont", () => {
  const TODONT_CLASSNAME = "roamjs-todont";
  const css = document.createElement("style");
  css.textContent = `.bp3-button.bp3-small.${TODONT_CLASSNAME} {
    background-color: red;
    border-radius: 0;
    padding: 0;
    min-height: 0;
    min-width: 0;
    height: 16px;
}`;
  document.getElementsByTagName("head")[0].appendChild(css);

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

  let previousActiveElement: HTMLElement;
  const todontIconButton = createMobileIcon(
    "mobile-todont-icon-button",
    "minus-square"
  );
  todontIconButton.onclick = () => {
    if (previousActiveElement.tagName === "TEXTAREA") {
      previousActiveElement.focus();
      todontCallback();
    }
  };

  todontIconButton.onmousedown = () => {
    previousActiveElement = document.activeElement as HTMLElement;
  };

  createObserver((mutationList: MutationRecord[]) => {
    mutationList.forEach((record) => {
      styleArchivedButtons(record.target as HTMLElement);
    });
    const mobileBackButton = document.getElementById("mobile-back-icon-button");
    if (
      !!mobileBackButton &&
      !document.getElementById("mobile-todont-icon-button")
    ) {
      const mobileBar = document.getElementById("rm-mobile-bar");
      if (mobileBar) {
        mobileBar.insertBefore(todontIconButton, mobileBackButton);
      }
    }
  });

  const resetCursor = (inputStart: number, inputEnd: number) => {
    const textArea = document.activeElement as HTMLTextAreaElement;
    const start = Math.max(0, inputStart);
    const end = Math.max(0, inputEnd);

    // hack to reset cursor in original location
    setTimeout(() => textArea.setSelectionRange(start, end), 1);
  };

  const todontCallback = async () => {
    if (document.activeElement.tagName === "TEXTAREA") {
      const textArea = document.activeElement as HTMLTextAreaElement;
      const value = textArea.value;
      const oldStart = textArea.selectionStart;
      const oldEnd = textArea.selectionEnd;
      if (
        value.startsWith("{{[[TODO]]}}") ||
        value.startsWith("{{[[DONE]]}}")
      ) {
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

  const keydownEventListener = async (e: KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey && e.ctrlKey) {
      todontCallback();
    }
  };

  document.addEventListener("keydown", keydownEventListener);
});
