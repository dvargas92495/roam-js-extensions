import { createIconButton, getAttrConfigFromQuery, getUids } from "roam-client";

declare global {
  interface Window {
    depot: {
      roamjs: {
        alerted: boolean;
      };
    };
  }
}

if (process.env.IS_LEGACY && !window.depot?.roamjs?.alerted) {
  window.alert(
    'Hey! Thanks for using extensions from roam.davidvargas.me! I\'m currently migrating the extensions to roamjs.com. Please edit the src in your roam/js block, replacing "roam.davidvargas.me/master" with "roamjs.com"'
  );
  if (!window.depot) {
    window.depot = { roamjs: { alerted: true } };
  } else if (!window.depot.roamjs) {
    window.depot.roamjs = { alerted: true };
  } else {
    window.depot.roamjs.alerted = true;
  }
}

export const createObserver = (
  mutationCallback: (mutationList?: MutationRecord[]) => void
) =>
  createDivObserver(
    mutationCallback,
    document.getElementsByClassName("roam-body")[0]
  );

export const createBlockObserver = (
  blockCallback: (b: HTMLDivElement) => void
) => {
  const blocks = document.getElementsByClassName("roam-block");
  Array.from(blocks).forEach(blockCallback);

  createObserver((ms) => {
    const blocks = ms.flatMap((m) =>
      Array.from(m.addedNodes).filter(
        (d: Node) =>
          d.nodeName === "DIV" &&
          Array.from((d as HTMLDivElement).classList).indexOf("roam-block") > -1
      )
    );
    const childBlocks = ms.flatMap((m) =>
      Array.from(m.addedNodes)
        .filter((n) => n.nodeName === "DIV")
        .flatMap((d) =>
          Array.from((d as HTMLDivElement).getElementsByClassName("roam-block"))
        )
    );
    blocks.forEach(blockCallback);
    childBlocks.forEach(blockCallback);
  });
};

export const createOverlayObserver = (
  mutationCallback: (mutationList?: MutationRecord[]) => void
) => createDivObserver(mutationCallback, document.body);

const createDivObserver = (
  mutationCallback: (mutationList?: MutationRecord[]) => void,
  mutationTarget: Element
) => {
  const observer = new MutationObserver(mutationCallback);
  observer.observe(mutationTarget, { childList: true, subtree: true });
};

const POPOVER_WRAPPER_CLASS = "sort-popover-wrapper";

export const createSortIcon = (
  refContainer: HTMLDivElement,
  sortCallbacks: { [key: string]: (refContainer: Element) => () => void }
) => {
  // Icon Button
  const popoverWrapper = document.createElement("span");
  popoverWrapper.className = `bp3-popover-wrapper ${POPOVER_WRAPPER_CLASS}`;

  const popoverTarget = document.createElement("span");
  popoverTarget.className = "bp3-popover-target";
  popoverWrapper.appendChild(popoverTarget);

  const popoverButton = createIconButton("sort");
  popoverTarget.appendChild(popoverButton);

  // Overlay Content
  const popoverOverlay = document.createElement("div");
  popoverOverlay.className = "bp3-overlay bp3-overlay-inline";
  popoverWrapper.appendChild(popoverOverlay);

  const transitionContainer = document.createElement("div");
  transitionContainer.className =
    "bp3-transition-container bp3-popover-enter-done";
  transitionContainer.style.position = "absolute";
  transitionContainer.style.willChange = "transform";
  transitionContainer.style.top = "0";
  transitionContainer.style.left = "0";

  const popover = document.createElement("div");
  popover.className = "bp3-popover";
  popover.style.transformOrigin = "162px top";
  transitionContainer.appendChild(popover);

  const popoverContent = document.createElement("div");
  popoverContent.className = "bp3-popover-content";
  popover.appendChild(popoverContent);

  const menuUl = document.createElement("ul");
  menuUl.className = "bp3-menu";
  popoverContent.appendChild(menuUl);

  const createMenuItem = (text: string, sortCallback: () => void) => {
    const liItem = document.createElement("li");
    const aMenuItem = document.createElement("a");
    aMenuItem.className = "bp3-menu-item bp3-popover-dismiss";
    liItem.appendChild(aMenuItem);
    const menuItemText = document.createElement("div");
    menuItemText.className = "bp3-text-overflow-ellipsis bp3-fill";
    menuItemText.innerText = text;
    aMenuItem.appendChild(menuItemText);
    menuUl.appendChild(liItem);
    aMenuItem.onclick = (e) => {
      sortCallback();
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    aMenuItem.onmousedown = (e) => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };
  };
  Object.keys(sortCallbacks).forEach((k: keyof typeof sortCallbacks) =>
    createMenuItem(`Sort By ${k}`, sortCallbacks[k](refContainer))
  );

  let popoverOpen = false;
  const documentEventListener = (e: MouseEvent) => {
    if (
      (!e.target || !popoverOverlay.contains(e.target as HTMLElement)) &&
      popoverOpen
    ) {
      closePopover();
    }
  };

  const closePopover = () => {
    popoverOverlay.className = "bp3-overlay bp3-overlay-inline";
    popoverOverlay.removeChild(transitionContainer);
    document.removeEventListener("click", documentEventListener);
    popoverOpen = false;
  };

  popoverButton.onmousedown = (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  };

  popoverButton.onclick = (e) => {
    if (!popoverOpen) {
      const target = e.target as HTMLButtonElement;
      transitionContainer.style.transform = `translate3d(${
        target.offsetLeft <= 240 ? target.offsetLeft : target.offsetLeft - 240
      }px, ${target.offsetTop + 24}px, 0px)`;
      popoverOverlay.className =
        "bp3-overlay bp3-overlay-open bp3-overlay-inline";
      popoverOverlay.appendChild(transitionContainer);
      e.stopImmediatePropagation();
      e.preventDefault();
      document.addEventListener("click", documentEventListener);
      popoverOpen = true;
    } else {
      closePopover();
    }
  };

  // Tooltip
  const tooltip = document.createElement("div");
  tooltip.className="bp3-overlay bp3-overlay-open bp3-overlay-inline";
  
  const tooltipContainer = document.createElement("div");
  tooltipContainer.className="bp3-transition-container bp3-popover-enter-done"; 
  tooltipContainer.style.position='absolute'; 
  tooltipContainer.style.willChange="transform"; 
  tooltipContainer.style.top= "0px"; 
  tooltipContainer.style.left = "0px"; 
  tooltipContainer.style.transform = "translate3d(664px, 2474px, 0px)";
  tooltip.appendChild(tooltipContainer);
  
  const tooltipPopover = document.createElement("div");
  tooltipPopover.className = "bp3-popover bp3-tooltip"; 
  tooltipPopover.style.transformOrigin = "62px top";
  tooltip.appendChild(tooltipPopover);

  const tooltipArrow = document.createElement("div");
  tooltipArrow.className = "bp3-popover-arrow"; 
  tooltipArrow.style.left = "51px"; 
  tooltipArrow.style.top = "-8px";
  tooltipPopover.appendChild(tooltipArrow);

  const tooltipSvg = document.createElementNS("http://www.w3.org/2000/svg","svg") as SVGSVGElement;
  tooltipSvg.setAttribute("viewBox","0 0 30 30");
  tooltipSvg.style.transform = "rotate(90deg);"
  tooltipArrow.appendChild(tooltipSvg);

  const tooltipPath1 = document.createElementNS("http://www.w3.org/2000/svg","path") as SVGPathElement;
  tooltipPath1.setAttribute('class', "bp3-popover-arrow-border"); 
  tooltipPath1.setAttribute('d',"M8.11 6.302c1.015-.936 1.887-2.922 1.887-4.297v26c0-1.378-.868-3.357-1.888-4.297L.925 17.09c-1.237-1.14-1.233-3.034 0-4.17L8.11 6.302z");
  tooltipSvg.appendChild(tooltipPath1);

  const tooltipPath2 = document.createElementNS("http://www.w3.org/2000/svg","path") as SVGPathElement;
  tooltipPath2.setAttribute('class', "bp3-popover-arrow-border"); 
  tooltipPath2.setAttribute('d',"M8.787 7.036c1.22-1.125 2.21-3.376 2.21-5.03V0v30-2.005c0-1.654-.983-3.9-2.21-5.03l-7.183-6.616c-.81-.746-.802-1.96 0-2.7l7.183-6.614z");
  tooltipSvg.appendChild(tooltipPath2);

  const tooltipContent = document.createElement("div");
  tooltipContent.className = "bp3-popover-content";
  tooltipContent.innerText = "Sort this page";
  tooltipPopover.appendChild(tooltipContent);

  return popoverWrapper;
};

// This API is terrible and should be redesigned
export const createSortIcons = (
  containerClass: string,
  callback: (container: HTMLDivElement) => void,
  sortCallbacks: { [key: string]: (refContainer: Element) => () => void },
  childIndex?: number,
  shouldCreate?: (container: HTMLDivElement) => boolean
) => {
  const sortButtonContainers = Array.from(
    document.getElementsByClassName(containerClass)
  ) as HTMLDivElement[];
  sortButtonContainers.forEach((sortButtonContainer) => {
    const exists =
      sortButtonContainer.getElementsByClassName(POPOVER_WRAPPER_CLASS).length >
      0;
    if (exists) {
      return;
    }

    if (shouldCreate && !shouldCreate(sortButtonContainer)) {
      return;
    }

    const popoverWrapper = createSortIcon(sortButtonContainer, sortCallbacks);
    if (childIndex) {
      const before = sortButtonContainer.children[childIndex];
      sortButtonContainer.insertBefore(popoverWrapper, before);
    } else {
      sortButtonContainer.appendChild(popoverWrapper);
    }

    callback(sortButtonContainer);
  });
};

export const getCreatedTimeByTitle = (title: string) => {
  const result = window.roamAlphaAPI.q(
    `[:find (pull ?e [:create/time]) :where [?e :node/title "${title.replace(
      /"/g,
      '\\"'
    )}"]]`
  )[0][0]?.time;
  return result || getEditTimeByTitle(title);
};

export const getEditTimeByTitle = (title: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:edit/time]) :where [?e :node/title "${title.replace(
      /"/g,
      '\\"'
    )}"]]`
  )[0][0]?.time;

export const getConfigFromBlock = (container: HTMLElement) => {
  const block = container.closest(".roam-block");
  if (!block) {
    return {};
  }
  const blockId = block.id.substring(block.id.length - 9, block.id.length);

  return getAttrConfigFromQuery(
    `[:find (pull ?e [*]) :where [?e :block/uid "${blockId}"]]`
  );
};

const getWordCount = (str = "") => str.trim().split(/\s+/).length;

const getWordCountByBlockId = (blockId: number): number => {
  const block = window.roamAlphaAPI.pull(
    "[:block/children, :block/string]",
    blockId
  );
  const children = block[":block/children"] || [];
  const count = getWordCount(block[":block/string"]);
  return (
    count +
    children
      .map((c) => getWordCountByBlockId(c[":db/id"]))
      .reduce((total, cur) => cur + total, 0)
  );
};

export const getWordCountByBlockUid = (blockUid: string) => {
  const block = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/children, :block/string]) :where [?e :block/uid "${blockUid}"]]`
  )[0][0];
  const children = block.children || [];
  const count = getWordCount(block.string);
  return (
    count +
    children
      .map((c) => getWordCountByBlockId(c.id))
      .reduce((total, cur) => cur + total, 0)
  );
};

export const getWordCountByPageTitle = (title: string) => {
  const page = window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/children]) :where [?e :node/title "${title}"]]`
  )[0][0];
  const children = page.children || [];
  return children
    .map((c) => getWordCountByBlockId(c.id))
    .reduce((total, cur) => cur + total, 0);
};

export const getTextByBlockUid = (uid: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:block/string]) :where [?e :block/uid "${uid}"]]`
  )[0][0]?.string;

export const getRefTitlesByBlockUid = (uid: string) =>
  window.roamAlphaAPI
    .q(
      `[:find (pull ?r [:node/title]) :where [?e :block/refs ?r] [?e :block/uid "${uid}"]]`
    )
    .map((b) => b[0]?.title || "");

export const getCreateTimeByBlockUid = (uid: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:create/time]) :where [?e :block/uid "${uid}"]]`
  )[0][0]?.time;

export const getEditTimeByBlockUid = (uid: string) =>
  window.roamAlphaAPI.q(
    `[:find (pull ?e [:edit/time]) :where [?e :block/uid "${uid}"]]`
  )[0][0]?.time;

export const getPageTitle = (e: Element) => {
  const container = e.closest(".roam-log-page") || document;
  const heading = container.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  return Array.from(heading.childNodes).find(
    (n) => n.nodeName === "#text" || n.nodeName === "SPAN"
  );
};

export type RoamBlock = {
  title?: string;
  time?: number;
  id?: number;
  uid?: string;
};

export const getLinkedPageReferences = (t: string) => {
  const findParentBlock: (b: RoamBlock) => RoamBlock = (b: RoamBlock) =>
    b.title
      ? b
      : findParentBlock(
          window.roamAlphaAPI.q(
            `[:find (pull ?e [*]) :where [?e :block/children ${b.id}]]`
          )[0][0] as RoamBlock
        );
  const parentBlocks = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [*]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${t.replace(
        /"/g,
        '\\"'
      )}"]]`
    )
    .filter((block) => block.length);
  return parentBlocks.map((b) => findParentBlock(b[0])) as RoamBlock[];
};

export const getLinkedReferences = (t: string) => {
  const parentBlocks = window.roamAlphaAPI
    .q(
      `[:find (pull ?referencingBlock [*]) :where [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${t.replace(
        /"/g,
        '\\"'
      )}"]]`
    )
    .filter((block) => block.length);
  return parentBlocks.map((b) => b[0]) as RoamBlock[];
};

export const createMobileIcon = (id: string, iconType: string) => {
  const iconButton = document.createElement("button");
  iconButton.id = id;
  iconButton.className =
    "bp3-button bp3-minimal rm-mobile-button dont-unfocus-block";
  iconButton.style.padding = "6px 4px 4px;";
  const icon = document.createElement("i");
  icon.className = `zmdi zmdi-hc-fw-rc zmdi-${iconType}`;
  icon.style.cursor = "pointer";
  icon.style.color = "rgb(92, 112, 128)";
  icon.style.fontSize = "18px";
  icon.style.transform = "scale(1.2)";
  icon.style.fontWeight = "1.8";
  icon.style.margin = "8px 4px";
  iconButton.appendChild(icon);
  return iconButton;
};
