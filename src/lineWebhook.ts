import * as functions from "firebase-functions";
import admin from "firebase-admin";
import * as Line from "api/Line";

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
        const status = (
          await admin.database().ref(`/GrabFoodStatus/${myUid}`).once("value")
        ).val();
        if (status === "signing-in") {
          if (event.message.type === "text") {
            if (event.message.text.match(/^[0-9]{6}$/)) {
              // OTP
              // TODO: need to check what provider
              await admin
                .database()
                .ref(`/GrabOTP/${myUid}`)
                .set(event.message.text);
            } else {
              await Line.reply(
                event.replyToken,
                "Sir, the OTP should have exactly 6 numbers. Please try again."
              );
            }
          }
        }
      }
    }
  });
