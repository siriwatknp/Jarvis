import admin from "firebase-admin";
import * as Line from "api/Line";

export const sendMessageToFollowers = async (text: string) => {
  const lineFollowersRef = admin.firestore().collection("line-followers");
  const snapshot = await lineFollowersRef.get();
  const followers: Array<string> = [];
  snapshot.forEach((doc) => {
    followers.push(doc.id);
  });
  console.info("[Line] Send message to", followers.length, "people");
  return await Line.sendMessage(followers, text);
};
