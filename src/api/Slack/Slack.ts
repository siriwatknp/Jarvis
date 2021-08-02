import * as functions from "firebase-functions";
import fetch from "node-fetch";

export async function sendMessage(text: string) {
  return await fetch(functions.config().slack.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
    }),
  });
}
