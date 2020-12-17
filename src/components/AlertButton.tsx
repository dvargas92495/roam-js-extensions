import {
  Alert,
  Button,
  Checkbox,
  InputGroup,
  Label,
  Popover,
} from "@blueprintjs/core";
import { parseDate } from "chrono-node";
import React, { ChangeEvent, useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { asyncPaste, openBlock } from "roam-client";
import differenceInMillieseconds from "date-fns/differenceInMilliseconds";
import userEvent from "@testing-library/user-event";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { getRenderRoot } from "./hooks";

window.roamjs.extension.alert = {
  open: undefined,
};

export const LOCAL_STORAGE_KEY = "roamjsAlerts";

export type AlertContent = {
  when: string;
  message: string;
  id: number;
  allowNotification: boolean;
};

const WindowAlert: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [oldTitle, setOldTitle] = useState("");
  const onClose = useCallback(() => {
    document.title = oldTitle;
  }, [oldTitle]);
  window.roamjs.extension.alert.open = useCallback(
    (input: Omit<AlertContent, "when">) => {
      setOldTitle(document.title);
      document.title = `* ${document.title}`;
      setIsOpen(true);
      setMessage(input.message);
      removeAlertById(input.id);
    },
    [setIsOpen, setMessage, setOldTitle]
  );
  return (
    <Alert isOpen={isOpen} className={"roamjs-window-alert"} onClose={onClose}>
      {message}
    </Alert>
  );
};

export const renderWindowAlert = (): void =>
  ReactDOM.render(<WindowAlert />, getRenderRoot());

const removeAlertById = (alertId: number) => {
  const { alerts, nextId } = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_KEY)
  );
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({
      nextId,
      alerts: alerts.filter((a: AlertContent) => a.id !== alertId),
    })
  );
};

export const schedule = (
  input: Omit<AlertContent, "when"> & { timeout: number }
): NodeJS.Timeout =>
  setTimeout(() => {
    if (
      input.allowNotification &&
      window.Notification.permission === "granted"
    ) {
      const n = new window.Notification("RoamJS Alert", {
        body: input.message,
      });
      n.addEventListener("show", () => removeAlertById(input.id));
    } else {
      window.roamjs.extension.alert.open(input);
    }
  }, input.timeout);

const AlertButtonContent = ({ blockId }: { blockId: string }) => {
  const [when, setWhen] = useState("");
  const onWhenChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setWhen(e.target.value),
    [setWhen]
  );
  const [message, setMessage] = useState("");
  const onMessageChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value),
    [setMessage]
  );
  const [allowNotification, setAllowNotification] = useState(false);
  const onCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAllowNotification(e.target.checked);
      if (window.Notification.permission === "default" && e.target.checked) {
        Notification.requestPermission().then((result) => {
          if (result === "denied") {
            setAllowNotification(false);
          }
        });
      }
    },
    [setAllowNotification]
  );
  const onButtonClick = useCallback(async () => {
    const whenDate = parseDate(when);
    const timeout = differenceInMillieseconds(whenDate, new Date());
    const block = document.getElementById(blockId);
    const textarea = await openBlock(block);
    await userEvent.clear(textarea);
    if (timeout > 0) {
      const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
      const { alerts, nextId: id } = storage
        ? JSON.parse(storage)
        : { alerts: [], nextId: 1 };
      schedule({
        message,
        id,
        timeout,
        allowNotification,
      });
      await asyncPaste(
        `Alert scheduled to trigger in ${formatDistanceToNow(whenDate)}`
      );

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          alerts: [
            ...alerts,
            {
              when: whenDate.toJSON(),
              message,
              id,
            },
          ],
          nextId: id + 1,
        })
      );
    } else {
      await asyncPaste(`Alert scheduled to with an invalid date`);
    }
  }, [blockId, when, message, allowNotification, close]);
  return (
    <div style={{ padding: 8, paddingRight: 24 }}>
      <InputGroup
        value={when}
        onChange={onWhenChange}
        placeholder={"When"}
        style={{ margin: 8 }}
        autoFocus={true}
      />
      <InputGroup
        value={message}
        onChange={onMessageChange}
        placeholder={"Message"}
        style={{ margin: 8 }}
      />
      <Label style={{ margin: 8 }}>
        Allow Notification?
        <Checkbox
          checked={allowNotification}
          onChange={onCheckboxChange}
          disabled={window.Notification.permission === "denied"}
        />
      </Label>
      <Button text="Schedule" onClick={onButtonClick} style={{ margin: 8 }} />
    </div>
  );
};

const AlertButton = ({ blockId }: { blockId: string }): JSX.Element => (
  <Popover
    content={<AlertButtonContent blockId={blockId} />}
    target={<Button text="ALERT" data-roamjs-alert-button />}
    defaultIsOpen={true}
  />
);

export const render = (b: HTMLButtonElement): void =>
  ReactDOM.render(
    <AlertButton blockId={b.closest(".roam-block").id} />,
    b.parentElement
  );

export default AlertButton;
