import {
  createObserver,
  createSortIcons,
  getConfigFromBlock,
  getCreatedTimeByTitle,
  getEditTimeByTitle,
} from "../entry-helpers";
import { parseRoamDate } from "roam-client";

const menuItemCallback = (
  sortContainer: Element,
  sortBy: (a: string, b: string) => number
) => () => {
  const refContainer = sortContainer.getElementsByClassName(
    "refs-by-page-view"
  )[0];
  const refsInView = Array.from(
    refContainer.getElementsByClassName("rm-ref-page-view")
  );
  refsInView.forEach((r) => refContainer.removeChild(r));
  refsInView.sort((a, b) => {
    const aTitle = a.getElementsByClassName(
      "rm-ref-page-view-title"
    )[0] as HTMLDivElement;
    const bTitle = b.getElementsByClassName(
      "rm-ref-page-view-title"
    )[0] as HTMLDivElement;
    return sortBy(aTitle.textContent, bTitle.textContent);
  });
  refsInView.forEach((r) => refContainer.appendChild(r));
};

const sortCallbacks = {
  "Page Title": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => a.localeCompare(b)),
  "Page Title Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => b.localeCompare(a)),
  "Created Date": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getCreatedTimeByTitle(a) - getCreatedTimeByTitle(b)
    ),
  "Created Date Descending": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getCreatedTimeByTitle(b) - getCreatedTimeByTitle(a)
    ),
  "Edited Date": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getEditTimeByTitle(a) - getEditTimeByTitle(b)
    ),
  "Edited Date Descending": (refContainer: Element) =>
    menuItemCallback(
      refContainer,
      (a, b) => getEditTimeByTitle(b) - getEditTimeByTitle(a)
    ),
  "Daily Note": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => {
      const aDate = parseRoamDate(a).valueOf();
      const bDate = parseRoamDate(b).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return getCreatedTimeByTitle(a) - getCreatedTimeByTitle(b);
      } else if (isNaN(aDate)) {
        return 1;
      } else if (isNaN(bDate)) {
        return -1;
      } else {
        return aDate - bDate;
      }
    }),
  "Daily Note Descending": (refContainer: Element) =>
    menuItemCallback(refContainer, (a, b) => {
      const aDate = parseRoamDate(a).valueOf();
      const bDate = parseRoamDate(b).valueOf();
      if (isNaN(aDate) && isNaN(bDate)) {
        return getCreatedTimeByTitle(b) - getCreatedTimeByTitle(a);
      } else if (isNaN(aDate)) {
        return 1;
      } else if (isNaN(bDate)) {
        return -1;
      } else {
        return bDate - aDate;
      }
    }),
};

const onCreateSortIcons = (container: HTMLDivElement) => {
  const config = getConfigFromBlock(container);

  const defaultSort = config["Default Sort"] as keyof typeof sortCallbacks;
  if (defaultSort && sortCallbacks[defaultSort]) {
    sortCallbacks[defaultSort](container)();
  }
};

const QUERY_START = "{{query:";
const QUERY_END = "}}";
const OR_QUERY_START = "{or:";
const TAG_QUERY_START = "[[";
const TAG_QUERY_END = "]]";
const SUB_QUERY_END = "}";
type QueryNode = {
  type: string;
  children: QueryNode[];
  value: string | null;
  rest: string;
};
const parseSubQuery: (s: string) => QueryNode = (s: string) => {
  if (s.startsWith(OR_QUERY_START)) {
    let orQuery = s.substring(OR_QUERY_START.length).trim();
    const children = [];
    while (!orQuery.startsWith(SUB_QUERY_END)) {
      const child = parseSubQuery(orQuery);
      orQuery = child.rest;
      children.push(child);
    }
    return {
      type: "OR",
      children,
      value: null,
      rest: orQuery.substring(SUB_QUERY_END.length),
    };
  } else if (s.startsWith(TAG_QUERY_START)) {
    const end = s.indexOf(TAG_QUERY_END);
    const tag = s.substring(TAG_QUERY_START.length, end);
    return {
      type: "TAG",
      value: tag,
      children: [],
      rest: s.substring(end + TAG_QUERY_END.length).trim(),
    };
  } else {
    return {
      type: "NULL",
      value: null,
      children: [],
      rest: "",
    };
  }
};

const parseQuery = (s: string) => {
  const query = s
    .substring(QUERY_START.length, s.length - QUERY_END.length)
    .trim();
  return parseSubQuery(query);
};

const observerCallback = () => {
  createSortIcons("rm-query-content", onCreateSortIcons, sortCallbacks, 1);
  const queries = Array.from(
    document.getElementsByClassName("rm-query-content")
  )
    .filter((e) => !e.getAttribute("data-is-random-results"))
    .map(
      (e) =>
        e
          .closest(".rm-query")
          .getElementsByClassName("rm-query-title")[0] as HTMLDivElement
    )
    .map((e) => parseQuery(e.innerText));
  console.log(queries);
};

observerCallback();
createObserver(observerCallback);
