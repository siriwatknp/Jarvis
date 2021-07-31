import fetch from "node-fetch";

export async function sendMessage(text: string) {
  await fetch(
    "https://hooks.slack.com/services/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",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    }
  );
}
