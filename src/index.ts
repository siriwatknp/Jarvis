import admin from "firebase-admin";
import * as functions from "firebase-functions";
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';

admin.initializeApp();

export { trackNpmDownload } from "./trackNpmDownload";
export { pickAMeal } from "./pickAMeal";
export { pickAMealE2E_mVAfm } from "./pickAMeal.e2e";
export { lineWebhook } from "./lineWebhook";
export { stayLoginGrabFood } from "./stayLoginGrabFood";
export { buyLV } from "./buyLV";
// export { notifyLV } from "./notifyLV"; // seems like login is more confident
export { ghIssueTracker } from "./ghIssueTracker";

export const testDate = functions
  .region("asia-southeast1")
  .pubsub.schedule(
    "* * * * *"
  )
  .timeZone("Asia/Bangkok")
  .onRun(async (context) => {
    dayjs.extend(timezone);
    dayjs.tz.setDefault('Asia/Bangkok');

    console.log(dayjs().toString());
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  });
