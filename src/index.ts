import admin from "firebase-admin";

admin.initializeApp();

export { trackNpmDownload } from "./trackNpmDownload";
export { pickAMeal } from "./pickAMeal";
export { lineWebhook } from "./lineWebhook";
