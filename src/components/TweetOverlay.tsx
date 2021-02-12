import {
  Button,
  Icon,
  Popover,
  Portal,
  Spinner,
  Text,
} from "@blueprintjs/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import Twitter from "../assets/Twitter.svg";
import {
  getTreeByBlockUid,
  getTreeByPageName,
  generateBlockUid,
  getUids,
} from "roam-client";
import { API_URL, getSettingValueFromTree } from "./hooks";
import axios from "axios";
import twitter from "twitter-text";

const TwitterContent: React.FunctionComponent<{
  blockUid: string;
  tweetId?: string;
  close: () => void;
}> = ({ close, blockUid, tweetId }) => {
  const message = useMemo(
    () =>
      getTreeByBlockUid(blockUid).children.map((t) => ({
        content: t.text,
        uid: t.uid,
      })),
    [blockUid]
  );
  const [error, setError] = useState("");
  const [tweetsSent, setTweetsSent] = useState(0);
  const onClick = useCallback(async () => {
    setError("");
    const tree = getTreeByPageName("roam/js/twitter");
    const oauth = getSettingValueFromTree({
      tree,
      key: "oauth",
      defaultValue: "{}",
    });
    if (oauth === "{}") {
      setError(
        "Need to log in with Twitter to send Tweets! Head to roam/js/twitter page to log in."
      );
      return;
    }
    const { oauth_token: key, oauth_token_secret: secret } = JSON.parse(oauth);
    const sentBlockUid = getSettingValueFromTree({
      tree,
      key: "sent",
    })
      .replace("((", "")
      .replace("))", "");
    const sourceUid = generateBlockUid();
    if (sentBlockUid) {
      window.roamAlphaAPI.createBlock({
        location: { "parent-uid": sentBlockUid, order: 0 },
        block: {
          string: `Sent at ${new Date().toLocaleString()}`,
          uid: sourceUid,
        },
      });
    }
    let in_reply_to_status_id = tweetId;
    let success = true;
    for (let index = 0; index < message.length; index++) {
      setTweetsSent(index + 1);
      const { content, uid } = message[index];
      success = await axios
        .post(`${API_URL}/twitter-tweet`, {
          key,
          secret,
          content: `${content}`,
          in_reply_to_status_id,
          auto_populate_reply_metadata: !!in_reply_to_status_id,
        })
        .then((r) => {
          const { id_str } = r.data;
          in_reply_to_status_id = id_str;
          if (sentBlockUid) {
            window.roamAlphaAPI.moveBlock({
              location: { "parent-uid": sourceUid, order: index },
              block: { uid },
            });
          }
          return true;
        })
        .catch((e) => {
          if (sentBlockUid && index === 0) {
            window.roamAlphaAPI.deleteBlock({ block: { uid: sourceUid } });
          }
          setError(
            e.response?.data?.errors
              ? e.response?.data?.errors
                  .map(({ code }: { code: number }) => {
                    switch (code) {
                      case 220:
                        return "Invalid credentials. Try logging in through the roam/js/twitter page";
                      case 186:
                        return "Tweet is too long. Make it shorter!";
                      case 170:
                        return "Tweet failed to send because it was empty.";
                      case 187:
                        return "Tweet failed to send because Twitter detected it was a duplicate.";
                      default:
                        return `Unknown error code (${code}). Email support@roamjs.com for help!`;
                    }
                  })
                  .join("\n")
              : e.message
          );
          setTweetsSent(0);
          return false;
        });
      if (!success) {
        break;
      }
    }
    if (success) {
      close();
    }
  }, [setTweetsSent, close, setError, tweetId]);
  return (
    <div style={{ padding: 16, maxWidth: 400 }}>
      <Button text={tweetId ? "Send Reply" : "Send Tweet"} onClick={onClick} />
      {tweetsSent > 0 && (
        <div>
          Sending {tweetsSent} of {message.length} tweets.{" "}
          <Spinner size={Spinner.SIZE_SMALL} />
        </div>
      )}
      {error && (
        <div style={{ color: "red", whiteSpace: "pre-line" }}>
          <Text>{error}</Text>
        </div>
      )}
    </div>
  );
};

const TweetOverlay: React.FunctionComponent<{
  blockUid: string;
  tweetId?: string;
  childrenRef: HTMLDivElement;
  unmount: () => void;
}> = ({ childrenRef, blockUid, unmount, tweetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const calcCounts = useCallback(
    () =>
      getTreeByBlockUid(blockUid).children.map((t) => {
        const { weightedLength, valid } = twitter.parseTweet(t.text);
        return {
          count: weightedLength,
          valid,
          uid: t.uid,
        };
      }),
    [blockUid]
  );
  const calcBlocks = useCallback(
    () =>
      Array.from(childrenRef.children)
        .filter((c) => c.className.includes("roam-block-container"))
        .map(
          (c) =>
            Array.from(c.children).find((c) =>
              c.className.includes("rm-block-main")
            ) as HTMLDivElement
        ),
    [childrenRef]
  );
  const [counts, setCounts] = useState(calcCounts);
  const blocks = useRef(calcBlocks());
  const valid = useMemo(() => counts.every(({ valid }) => valid), [counts]);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const inputCallback = useCallback(
    (e: InputEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;
        const { blockUid: currentUid } = getUids(textarea);
        blocks.current = calcBlocks();
        setCounts(
          calcCounts().map((c) => {
            if (c.uid === currentUid) {
              const { weightedLength, valid } = twitter.parseTweet(
                textarea.value
              );
              return { uid: currentUid, count: weightedLength, valid };
            } else {
              return c;
            }
          })
        );
      }
    },
    [blockUid, setCounts, calcCounts, calcBlocks, blocks]
  );
  useEffect(() => {
    childrenRef.addEventListener("input", inputCallback);
    return () => childrenRef.removeEventListener("input", inputCallback);
  }, [childrenRef, inputCallback]);
  useEffect(() => {
    if (rootRef.current && !document.contains(rootRef.current.targetElement)) {
      unmount();
    }
  });
  return (
    <>
      <Popover
        target={
          <Icon
            icon={
              <Twitter
                style={{
                  width: 15,
                  marginLeft: 4,
                  cursor: valid ? "pointer" : "not-allowed",
                }}
              />
            }
            onClick={open}
          />
        }
        content={
          <TwitterContent blockUid={blockUid} tweetId={tweetId} close={close} />
        }
        isOpen={isOpen}
        onInteraction={(next) => setIsOpen(next && valid)}
        ref={rootRef}
      />
      {counts
        .filter((_, i) => !!blocks.current[i])
        .map(({ count, uid }, i) => (
          <Portal
            container={blocks.current[i]}
            key={uid}
            className={"roamjs-twitter-count"}
          >
            <span style={{ color: count > 280 ? "red" : "black" }}>
              {count}/280
            </span>
          </Portal>
        ))}
    </>
  );
};

export const render = ({
  parent,
  blockUid,
  tweetId,
}: {
  parent: HTMLSpanElement;
  blockUid: string;
  tweetId?: string;
}): void => {
  const childrenRef = parent.closest(".rm-block-main")
    ?.nextElementSibling as HTMLDivElement;
  Array.from(
    childrenRef.getElementsByClassName("roamjs-twitter-count")
  ).forEach((s) => s.remove());
  ReactDOM.render(
    <TweetOverlay
      blockUid={blockUid}
      tweetId={tweetId}
      childrenRef={childrenRef}
      unmount={() => ReactDOM.unmountComponentAtNode(parent)}
    />,
    parent
  );
};

export default TweetOverlay;
