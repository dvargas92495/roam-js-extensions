import emoji from "node-emoji";
import userEvent from "@testing-library/user-event";

const HIGHLIGHTED_COLOR = "#0000001c";

let searchText = "";
let emojiOn = false;
let menuItemIndex = 0;
let results: emoji.Emoji[] = [];
let currentTarget: HTMLTextAreaElement = document.createElement("textarea");

// The following styling is ripped from Roam's menu style
let menu = document.createElement("div");
menu.className = "bp3-elevation-3";
menu.style.maxHeight = "300px";
menu.style.top = "26px";
menu.style.overflow = "auto";
menu.style.backgroundColor = "white";
menu.style.width = "400px";
menu.style.maxWidth = "400px";
menu.style.zIndex = "10";
menu.style.padding = "4px";
menu.style.position = "absolute";
menu.style.marginRight = "24px";
menu.style.marginBottom = "24px";
menu.style.left = "10px";

const clearMenu = () => {
  while (menu.lastChild) {
    menu.removeChild(menu.lastChild);
  }
};

const turnOnEmoji = () => {
  currentTarget = document.activeElement as HTMLTextAreaElement;
  currentTarget.addEventListener("keydown", emojiKeyDownListener);

  const parentDiv = currentTarget.parentElement as HTMLDivElement;
  parentDiv.appendChild(menu);
  emojiOn = true;
  searchText = ":";
  menuItemIndex = 0;
};

const turnOffEmoji = () => {
  if (emojiOn) {
    const parentDiv = document.activeElement.parentElement as HTMLDivElement;
    if (parentDiv.contains(menu)) {
      parentDiv.removeChild(menu);
      clearMenu();
    }
    emojiOn = false;
  }
  searchText = "";
  currentTarget.removeEventListener("keydown", emojiKeyDownListener);
};

const insertEmoji = (target: HTMLTextAreaElement, emojiCode: string) => {
  const initialValue = target.value;
  const preValue = initialValue.substring(
    0,
    initialValue.length - searchText.length
  );
  target.setSelectionRange(preValue.length, initialValue.length);
  userEvent.type(target, "{backspace}");
  userEvent.type(target, emojiCode);
  turnOffEmoji();
};

const createMenuElement = (size: number) => (
  { emoji, key }: emoji.Emoji,
  i: number
) => {
  const title = `${key} ${emoji}`;
  const container = document.createElement("div");
  container.title = title;
  container.className = "dont-unfocus-block";
  container.style.borderRadius = "2px";
  container.style.padding = "6px";
  container.style.cursor = "pointer";
  if (i % size === menuItemIndex) {
    container.style.backgroundColor = HIGHLIGHTED_COLOR;
  }

  const result = document.createElement("div");
  result.className = "rm-autocomplete-result";
  result.innerText = title;

  const target = document.activeElement as HTMLTextAreaElement;
  result.onclick = () => insertEmoji(target, emoji);
  container.appendChild(result);

  menu.appendChild(container);
};

const emojiKeyDownListener = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    if (results.length == 0) {
      turnOffEmoji();
    } else {
      insertEmoji(
        e.target as HTMLTextAreaElement,
        results[menuItemIndex].emoji
      );
      e.preventDefault();
      e.stopPropagation();
    }
  } else if (e.key === "ArrowDown" && results.length > 0) {
    const oldElement = menu.children[menuItemIndex] as HTMLDivElement;
    oldElement.style.backgroundColor = "";
    menuItemIndex = (menuItemIndex + 1) % results.length;
    const newElement = menu.children[menuItemIndex] as HTMLDivElement;
    newElement.style.backgroundColor = HIGHLIGHTED_COLOR;
    e.preventDefault();
    e.stopPropagation();
  } else if (e.key === "ArrowUp" && results.length > 0) {
    const oldElement = menu.children[menuItemIndex] as HTMLDivElement;
    oldElement.style.backgroundColor = "";
    menuItemIndex = (menuItemIndex - 1 + results.length) % results.length;
    const newElement = menu.children[menuItemIndex] as HTMLDivElement;
    newElement.style.backgroundColor = HIGHLIGHTED_COLOR;
    e.preventDefault();
    e.stopPropagation();
  }
};

const searchEmojis = (text: string) => {
  results = emoji.search(text).slice(0, 5);
  clearMenu();
  results.forEach(createMenuElement(results.length));
};

const inputEventListener = async (e: InputEvent) => {
  if (e.data === ":") {
    if (!emojiOn) {
      turnOnEmoji();
    } else if (!emoji.hasEmoji(searchText)) {
      turnOffEmoji();
    } else {
      searchText = `${searchText}:`;
      insertEmoji(e.target as HTMLTextAreaElement, emoji.get(searchText));
    }
  } else if (e.inputType === "deleteContentBackward") {
    if (searchText) {
      searchText = searchText.substring(0, searchText.length - 1);
      searchEmojis(searchText);
    } else {
      turnOffEmoji();
    }
  } else if (!/\s/.test(e.data) && e.data && emojiOn) {
    searchText += e.data;
    searchEmojis(searchText);
  } else {
    turnOffEmoji();
  }
};

document.addEventListener("input", inputEventListener);
