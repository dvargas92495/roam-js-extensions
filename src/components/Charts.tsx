import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { AxisType, Chart, SeriesType } from "react-charts";
import { getTextTreeByBlockUid } from "../entry-helpers";
import {
  Button,
  Card,
  Elevation,
  H6,
  Icon,
  InputGroup,
  Label,
  TextArea,
} from "@blueprintjs/core";
import { getUids, openBlock } from "roam-client";
import MenuItemSelect from "./MenuItemSelect";

const CHARTS_WRAPPER = "roamjs-charts-wrapper";
const CHART_WRAPPER = "roamjs-charts-chart-wrapper";
const LEGEND_WRAPPER = "roamjs-charts-legend-wrapper";
export const styleContent = `.${CHART_WRAPPER} {
    height: 300px;
    width: 400px;
    position: relative;
}

.${CHARTS_WRAPPER} {
  display: flex;
}

.${LEGEND_WRAPPER} {
  padding: 8px; 
  display: flex; 
  flex-direction: column;
}`;

// https://github.com/tannerlinsley/react-charts/blob/4217531a930db36b66e3a145096faf2c9e64f5b1/src/components/Chart.js#L30
const defaultColorScheme = [
  "#0f83ab",
  "#faa43a",
  "#ff4e4e",
  "#53cfc9",
  "#a2d925",
  "#decf3f",
  "#734fe9",
  "#cd82ad",
  "#006d92",
  "#de7c00",
  "#f33232",
  "#3f9a80",
  "#53c200",
  "#d7af00",
  "#4c26c9",
  "#d44d99",
];

const parseAxis: {
  [key: string]: (value: string) => string | number;
} = {
  linear: parseFloat,
  ordinal: (v: string) => v,
};

const BOTTOM_TYPE_KEY = "X-Axis::";
const LEFT_TYPE_KEY = "Y-Axis::";
const getProps = (blockId: string) => {
  const { blockUid } = getUids(
    document.getElementById(blockId).closest(".roam-block") as HTMLDivElement
  );
  const tree = getTextTreeByBlockUid(blockUid);
  const dataNodes = tree.children.filter((t) => t.text.indexOf("::") <= -1);
  const metaDataNodes = tree.children.filter((t) => t.text.indexOf("::") > -1);
  const bottomTypeNode = metaDataNodes.find((t) =>
    t.text.startsWith(BOTTOM_TYPE_KEY)
  );
  const leftTypeNode = metaDataNodes.find((t) =>
    t.text.startsWith(LEFT_TYPE_KEY)
  );
  return {
    data: dataNodes.map((t) => ({
      label: t.text,
      data: t.children.map((c) => c.text),
    })),
    initialBottomType: bottomTypeNode
      ? (bottomTypeNode.text
          .substring(BOTTOM_TYPE_KEY.length)
          .trim()
          .toLowerCase() as AxisType)
      : "linear",
    initialLeftType: leftTypeNode
      ? (leftTypeNode.text
          .substring(LEFT_TYPE_KEY.length)
          .trim()
          .toLowerCase() as AxisType)
      : "linear",
  };
};

const Charts = ({
  data,
  type,
  initialBottomType,
  initialLeftType,
  editCallback = () => {},
}: {
  type: SeriesType;
  data: { label: string; data: string[] }[];
  editCallback?: () => void;
  initialBottomType: AxisType;
  initialLeftType: AxisType;
}) => {
  const [leftType, setLeftType] = useState<AxisType>(initialBottomType);
  const [bottomType, setBottomType] = useState<AxisType>(initialLeftType);
  const chartData = React.useMemo(
    () =>
      data.map((d) => ({
        ...d,
        data: d.data.map((s) =>
          s
            .split(",")
            .map((n, i) => parseAxis[i === 0 ? bottomType : leftType](n.trim()))
        ),
      })),
    [data, bottomType, leftType]
  );
  const axes = React.useMemo(
    () => [
      { primary: true, type: bottomType, position: "bottom" },
      { type: leftType as AxisType, position: "left" },
    ],
    [leftType, bottomType]
  );
  const series = React.useMemo(() => ({ type }), []);
  const [showEditIcon, setShowEditIcon] = useState(false);
  const appear = useCallback(() => setShowEditIcon(true), [setShowEditIcon]);
  const disappear = useCallback(() => setShowEditIcon(false), [
    setShowEditIcon,
  ]);
  return (
    <div className={CHARTS_WRAPPER}>
      <div
        className={CHART_WRAPPER}
        onMouseOver={appear}
        onMouseLeave={disappear}
      >
        {showEditIcon && (
          <Button
            icon="edit"
            minimal
            style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
            onClick={editCallback}
          />
        )}
        <Chart data={chartData} axes={axes} series={series} />
      </div>
      <div className={LEGEND_WRAPPER}>
        <Label>
          X Axis Type
          <MenuItemSelect
            items={["linear", "ordinal"]}
            onItemSelect={(item) => setBottomType(item)}
            activeItem={bottomType}
          />
        </Label>
        <Label>
          Y Axis Type
          <MenuItemSelect
            items={["linear", "ordinal"]}
            onItemSelect={(item) => setLeftType(item)}
            activeItem={leftType}
          />
        </Label>
        <Card elevation={Elevation.TWO}>
          <H6>Legend</H6>
          {data.map(({ label }, i) => (
            <p key={i}>
              {label}{" "}
              <Icon icon={"layout-linear"} color={defaultColorScheme[i]} />
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
};

const editCallback = (blockId: string) => () =>
  openBlock(document.getElementById(blockId));

export const renderLineChart = ({
  blockId,
  parent,
}: {
  blockId: string;
  parent: HTMLElement;
}) =>
  ReactDOM.render(
    <Charts
      type={"line"}
      {...getProps(blockId)}
      editCallback={editCallback(blockId)}
    />,
    parent
  );

export const renderBarChart = ({
  blockId,
  parent,
}: {
  blockId: string;
  parent: HTMLElement;
}) =>
  ReactDOM.render(
    <Charts
      type={"bar"}
      {...getProps(blockId)}
      editCallback={editCallback(blockId)}
    />,
    parent
  );

export const DemoCharts = () => {
  const [data, setData] = React.useState([
    {
      label: "Series 1",
      data: `0, 1
1, 2
2, 4
3, 2
4, 7`,
      key: 0,
    },
    {
      label: "Series 2",
      data: `0, 3
1, 1
2, 5
3, 6
4, 4`,
      key: 1,
    },
  ]);
  // const [key, setKey] = useState(2);
  return (
    <>
      <Charts
        data={data.map((d) => ({ ...d, data: d.data.trim().split("\n") }))}
        type={"line"}
        initialBottomType={"linear"}
        initialLeftType={"linear"}
      />
      {data.map((d) => (
        <div key={d.key} style={{ width: 400, padding: 4 }}>
          <InputGroup
            value={d.label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setData(
                data.map((dd) =>
                  dd.key === d.key ? { ...d, label: e.target.value } : dd
                )
              )
            }
          />
          <TextArea
            value={d.data}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setData(
                data.map((dd) =>
                  dd.key === d.key ? { ...d, data: e.target.value } : dd
                )
              )
            }
            growVertically={true}
            style={{ width: "100%", resize: "none" }}
          />
        </div>
      ))}
    </>
  );
};

export default Charts;
