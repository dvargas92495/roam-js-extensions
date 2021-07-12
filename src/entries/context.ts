import {
  createBlockObserver,
  createHashtagObserver,
  getBlockUidFromTarget,
  getPageTitleByBlockUid,
  getPageUidByPageTitle,
  getParentUidByBlockUid,
  getTextByBlockUid,
  getUids,
} from "roam-client";
import {
  getRoamUrl,
  openBlockInSidebar,
  parseRoamMarked,
  runExtension,
} from "../entry-helpers";

const ID = "context";

runExtension(ID, () => {
  createHashtagObserver({
    attribute: "data-roamjs-context-parent",
    callback: (s) => {
      if (s.getAttribute("data-tag") === "parent") {
        const uid = getBlockUidFromTarget(s);
        const parentUid = getParentUidByBlockUid(uid);
        const parentText = getTextByBlockUid(parentUid);
        s.className = "rm-block-ref dont-focus-block";
        s.style.userSelect = "none";
        s.innerHTML = parseRoamMarked(parentText);
        s.onmousedown = (e) => e.stopPropagation();
        s.onclick = (e) => {
          if (e.shiftKey) {
            openBlockInSidebar(parentUid);
          } else {
            window.location.assign(getRoamUrl(parentUid));
          }
        };
      }
    },
  });

  createHashtagObserver({
    attribute: "data-roamjs-context-page",
    callback: (s) => {
      if (s.getAttribute("data-tag") === "page") {
        const uid = getBlockUidFromTarget(s);
        const page = getPageTitleByBlockUid(uid);
        s.className = "";
        const leftBracket = document.createElement("span");
        leftBracket.className = "rm-page-ref__brackets";
        leftBracket.innerText = "[[";
        const pageRef = document.createElement("span");
        pageRef.tabIndex = -1;
        pageRef.className = "rm-page-ref rm-page-ref--link";
        pageRef.innerText = page;
        const rightBracket = document.createElement("span");
        rightBracket.className = "rm-page-ref__brackets";
        rightBracket.innerText = "]]";
        s.innerHTML = "";
        s.style.userSelect = "none";
        s.appendChild(leftBracket);
        s.appendChild(pageRef);
        s.appendChild(rightBracket);
        s.onmousedown = (e) => e.stopPropagation();
        s.onclick = (e) => {
          const uid = getPageUidByPageTitle(page);
          if (e.shiftKey) {
            openBlockInSidebar(uid);
          } else {
            window.location.assign(getRoamUrl(uid));
          }
        };
      }
    },
  });

  createBlockObserver((b: HTMLDivElement) => {
    const { blockUid } = getUids(b);
    const found = window.roamAlphaAPI.q(
      `[:find ?t :where [?c :block/uid "${blockUid}"] [?r :block/parents ?c] [?r :block/refs ?e] [?e :node/title ?t]]`
    ).map(p => p[0] as string);
    if (found.includes('context')) {
      console.log(found);
    }
  });
});
