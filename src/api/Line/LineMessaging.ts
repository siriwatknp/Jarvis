import * as functions from "firebase-functions";
import fetch from "node-fetch";

export const sendMessage = async (lineUserIds: Array<string>, text: string) => {
  return await fetch("https://api.line.me/v2/bot/message/multicast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${functions.config().line.channelaccesstoken}`,
    },
    body: JSON.stringify({
      to: lineUserIds,
      messages: [{ type: "text", text }],
    }),
  });
};

export const reply = async (replyToken: string, text: string) => {
  return await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${functions.config().line.channelaccesstoken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
};
