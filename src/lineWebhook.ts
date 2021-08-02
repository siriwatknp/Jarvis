import * as functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

export const lineWebhook = functions
  .region("asia-southeast2")
  .https.onRequest(async (request) => {
    const event = request.body.events[0];
    if (event.type === "follow") {
      const { userId } = event.source;
      await admin
        .firestore()
        .collection("line-followers")
        .doc(userId)
        .set(event);
    }
  });
