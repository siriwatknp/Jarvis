import * as functions from "firebase-functions";
import admin from "firebase-admin";

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
    const myUid = functions.config().line.siriwatkuid;

    if (event.type === "message") {
      // siriwatk specific
      if (event.source.userId === myUid) {
        if (
          event.message.type === "text" &&
          event.message.text.match(/^[0-9]{6}$/)
        ) {
          // OTP
          // TODO: need to check what provider
          await admin
            .database()
            .ref(`/GrabOTP/${myUid}`)
            .set(event.message.text);
        }
      }
    }
  });
