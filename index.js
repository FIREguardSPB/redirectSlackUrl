import dotenv from "dotenv";
import KeyvMongoDB from "keyv-mongodb";

dotenv.config();
import pkg from "@slack/bolt";

const { App } = pkg;
import Keyv from "keyv";
import mongoose from "mongoose";

const PORT = 3000;
const keyv = new Keyv({
  store: new KeyvMongoDB({ mongooseConnection: mongoose.connection }),
});
keyv.on("error", (err) => console.log("Connection Error", err));

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: "my-state-secret",
  scopes: [
    "channels:history",
    "channels:manage",
    "channels:read",
    "chat:write",
    "commands",
    "im:history",
    "users:read",
    "users:read.email",
    "channels:join",
    "groups:history",
    "groups:history",
    "app_mentions:read",
    "incoming-webhook",
  ],
  installationStore: {
    storeInstallation: async (installation) => {
      // change the line below so it saves to your database
      if (installation.isEnterpriseInstall) {
        // support for org wide app installation
        return await keyv.set(installation.enterprise.id, installation);
      } else {
        // single team app installation
        return await keyv.set(installation.team.id, installation);
      }
      throw new Error("Failed saving installation data to installationStore");
    },
    fetchInstallation: async (installQuery) => {
      // change the line below so it fetches from your database
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        // org wide app installation lookup
        return await keyv.get(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        return await keyv.get(installQuery.teamId);
      }
      throw new Error("Failed fetching installation");
    },
  },
});

(async () => {
  await mongoose.connect(process.env.DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  await app.start(process.env.PORT || PORT);
  console.log(`⚡️ Bolt app is running! port ${PORT}`);
})();
