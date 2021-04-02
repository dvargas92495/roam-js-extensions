import {
  Button,
  Card,
  Icon,
  InputGroup,
  Label,
  NumericInput,
  Tab,
  Tabs,
  Tooltip,
} from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import {
 // createPage,
  getPageUidByPageTitle,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
} from "roam-client";
import {
  createHTMLObserver,
  getFirstChildUidByBlockUid,
} from "../entry-helpers";
import { toTitle } from "./hooks";
import PageInput from "./PageInput";

type Field = {
  type: keyof typeof Panels;
  title: string;
  description: string;
};

type FieldPanel = <T extends Field>({
  title,
  order,
  uid,
  parentUid,
}: {
  order: number;
  uid?: string;
  parentUid: string;
} & Omit<T, "type">) => React.ReactElement;

const Description = ({ description }: { description: string }) => {
  return (
    <span
      style={{
        marginLeft: 12,
        display: "inline-block",
        opacity: 0.8,
        verticalAlign: "text-bottom",
      }}
    >
      <Tooltip
        content={
          <span style={{ maxWidth: 400, display: "inline-block" }}>
            {description}
          </span>
        }
      >
        <Icon icon={"info-sign"} iconSize={12} />
      </Tooltip>
    </span>
  );
};

const TextPanel: FieldPanel = ({
  title,
  uid,
  parentUid,
  order,
  description,
}) => {
  const [valueUid, setValueUid] = useState(getFirstChildUidByBlockUid(uid));
  const [value, setValue] = useState(
    uid ? getTextByBlockUid(getFirstChildUidByBlockUid(uid)) : ""
  );
  return (
    <Label>
      {title}
      <Description description={description} />
      <InputGroup
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          if (valueUid) {
            window.roamAlphaAPI.updateBlock({
              block: { string: e.target.value, uid: valueUid },
            });
          } else {
            const fieldUid = window.roamAlphaAPI.util.generateUID();
            window.roamAlphaAPI.createBlock({
              block: { string: title, uid: fieldUid },
              location: { order, "parent-uid": parentUid },
            });
            const newValueUid = window.roamAlphaAPI.util.generateUID();
            window.roamAlphaAPI.createBlock({
              block: { string: e.target.value, uid: newValueUid },
              location: { order: 0, "parent-uid": fieldUid },
            });
            setValueUid(newValueUid);
          }
        }}
      />
    </Label>
  );
};

const NumberPanel: FieldPanel = ({
  title,
  uid,
  parentUid,
  order,
  description,
}) => {
  const [valueUid, setValueUid] = useState(getFirstChildUidByBlockUid(uid));
  const [value, setValue] = useState(
    uid ? getTextByBlockUid(getFirstChildUidByBlockUid(uid)) : 0
  );
  return (
    <Label>
      {title}
      <Description description={description} />
      <NumericInput
        value={value}
        onValueChange={(e, asStr) => {
          setValue(e);
          if (valueUid) {
            window.roamAlphaAPI.updateBlock({
              block: { string: asStr, uid: valueUid },
            });
          } else {
            const fieldUid = window.roamAlphaAPI.util.generateUID();
            window.roamAlphaAPI.createBlock({
              block: { string: title, uid: fieldUid },
              location: { order, "parent-uid": parentUid },
            });
            const newValueUid = window.roamAlphaAPI.util.generateUID();
            window.roamAlphaAPI.createBlock({
              block: { string: asStr, uid: newValueUid },
              location: { order: 0, "parent-uid": fieldUid },
            });
            setValueUid(newValueUid);
          }
        }}
      />
    </Label>
  );
};

const PagesPanel: FieldPanel = ({
  uid,
  title,
  parentUid,
  order,
  description,
}) => {
  const [pages, setPages] = useState(
    getTreeByBlockUid(uid).children.map((v) => ({ text: v.text, uid: v.uid }))
  );
  const [value, setValue] = useState("");
  return (
    <>
      <Label>
        {title}
        <Description description={description} />
        <div style={{ display: "flex" }}>
          <PageInput value={value} setValue={setValue} extra={["{all}"]} />
          <Button
            icon={"plus"}
            minimal
            onClick={() => {
              const valueUid = window.roamAlphaAPI.util.generateUID();
              if (uid) {
                window.roamAlphaAPI.createBlock({
                  location: { "parent-uid": uid, order: pages.length },
                  block: { string: value, uid: valueUid },
                });
              } else {
                const fieldUid = window.roamAlphaAPI.util.generateUID();
                window.roamAlphaAPI.createBlock({
                  block: { string: title, uid: fieldUid },
                  location: { order, "parent-uid": parentUid },
                });
                window.roamAlphaAPI.createBlock({
                  block: { string: value, uid: valueUid },
                  location: { order: 0, "parent-uid": fieldUid },
                });
              }
              setPages([...pages, { text: value, uid: valueUid }]);
              setValue("");
            }}
          />
        </div>
      </Label>
      {pages.map((p) => (
        <div
          key={p.uid}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {p.text}
          <Button
            icon={"trash"}
            minimal
            onClick={() => {
              window.roamAlphaAPI.deleteBlock({ block: { uid: p.uid } });
              setPages(pages.filter((f) => f.uid !== p.uid));
            }}
          />
        </div>
      ))}
    </>
  );
};

const Panels = {
  text: TextPanel,
  number: NumberPanel,
  pages: PagesPanel,
};

type ConfigTab = {
  id: string;
  fields: Field[];
};

type Config = {
  tabs: ConfigTab[];
};

const FieldTabs = ({
  id,
  fields,
  extensionId,
  pageUid,
}: {
  extensionId: string;
  pageUid: string;
} & ConfigTab) => {
  const [selectedTabId, setSelectedTabId] = useState(fields[0].title);
  const onTabsChange = useCallback((tabId: string) => setSelectedTabId(tabId), [
    setSelectedTabId,
  ]);
  const tree = getTreeByPageName(`roam/js/${extensionId}`);
  const subTree = tree.find((t) => new RegExp(id, "i").test(t.text));
  const [parentUid, parentTree] =
    id === "Home" ? [pageUid, tree] : [subTree?.uid, subTree?.children || []];
  return (
    <Tabs
      vertical
      id={`${id}-field-tabs`}
      onChange={onTabsChange}
      selectedTabId={selectedTabId}
      renderActiveTabPanelOnly
    >
      {fields.map((field, i) => {
        const { type, title } = field;
        const Panel = Panels[type];
        return (
          <Tab
            id={title}
            key={title}
            title={title}
            panel={
              <Panel
                {...field}
                order={i}
                parentUid={parentUid}
                uid={
                  parentTree.find((t) => new RegExp(title, "i").test(t.text))
                    ?.uid
                }
              />
            }
          />
        );
      })}
    </Tabs>
  );
};

const ConfigPage = ({
  id,
  config,
}: {
  id: string;
  config: Config;
}): React.ReactElement => {
  const [selectedTabId, setSelectedTabId] = useState(config.tabs[0].id);
  const onTabsChange = useCallback((tabId: string) => setSelectedTabId(tabId), [
    setSelectedTabId,
  ]);
  const pageUid = getPageUidByPageTitle(`roam/js/${id}`);
  return (
    <Card>
      <h4 style={{ padding: 4 }}>{toTitle(id)} Configuration</h4>
      <Tabs
        vertical
        id={`${id}-config-tabs`}
        onChange={onTabsChange}
        selectedTabId={selectedTabId}
      >
        {config.tabs.map(({ id: tabId, fields }) => (
          <Tab
            id={tabId}
            key={tabId}
            title={tabId}
            panel={
              <FieldTabs
                id={tabId}
                fields={fields}
                extensionId={id}
                pageUid={pageUid}
              />
            }
          />
        ))}
      </Tabs>
    </Card>
  );
};

export const createConfigObserver = ({
  title,
  config,
}: {
  title: string;
  config: Config;
}): void => {
  /*
  if (!getPageUidByPageTitle(title)) {
    createPage({
      title,
      tree: [
        {
          text: "daily",
          children: [
            {
              text: "includes",
            },
            {
              text: "excludes",
            },
            {
              text: "timeout",
              children: [
                {
                  text: `${DEFAULT_TIMEOUT_COUNT}`,
                },
              ],
            },
            {
              text: "label",
              children: [
                {
                  text: DEFAULT_DAILY_LABEL,
                },
              ],
            },
            {
              text: "count",
              children: [
                {
                  text: `${DEFAULT_DAILY_COUNT}`,
                },
              ],
            },
          ],
        },
      ],
    });
  }*/
  createHTMLObserver({
    className: "rm-title-display",
    tag: "H1",
    callback: (d: HTMLHeadingElement) => {
      if (d.innerText === title) {
        const uid = getPageUidByPageTitle(title);
        const attribute = `data-roamjs-${uid}`;
        if (!d.hasAttribute(attribute)) {
          d.setAttribute(attribute, "true");
          const parent = document.createElement("div");
          parent.id = `${title.replace("roam/js/", "roamjs-")}-config`;
          d.parentElement.parentElement.insertBefore(
            parent,
            d.parentElement.nextElementSibling
          );
          ReactDOM.render(
            <ConfigPage id={title.replace("roam/js/", "")} config={config} />,
            parent
          );
        }
      }
    },
  });
};

export default ConfigPage;
