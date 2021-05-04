// import dotenv from "dotenv";
// import KeyvMongoDB from "keyv-mongodb";
//
// dotenv.config();
// import { InstallProvider, LogLevel } from "@slack/oauth";
// import express from "express";
// import Keyv from "keyv";
// import mongoose from "mongoose";
//
// const app = express();
// const PORT = 3000;
// mongoose.connect(process.env.DB_URL, {
//   useUnifiedTopology: true,
//   useNewUrlParser: true,
// });
// const keyv = new Keyv({
//   store: new KeyvMongoDB({ mongooseConnection: mongoose.connection }),
// });
// keyv.on("error", (err) => console.log("Connection Error", err));
//
// const installer = new InstallProvider({
//   clientId: process.env.SLACK_CLIENT_ID,
//   clientSecret: process.env.SLACK_CLIENT_SECRET,
//   authVersion: "v2",
//   stateSecret: "my-state-secret",
//
//   logLevel: LogLevel.DEBUG,
//   installationStore: {
//     storeInstallation: async (installation) => {
//       if (installation.isEnterpriseInstall) {
//         // storing org installation
//         return await keyv.set(installation.enterprise.id, installation);
//       } else if (
//         installation.team !== null &&
//         installation.team.id !== undefined
//       ) {
//         // storing single team installation
//         return await keyv.set(installation.team.id, installation);
//       }
//       throw new Error("Failed saving installation data to installationStore");
//     },
//     fetchInstallation: async (installQuery) => {
//       if (installQuery.isEnterpriseInstall) {
//         if (installQuery.enterpriseId !== undefined) {
//           // fetching org installation
//           return await keyv.get(installQuery.enterpriseId);
//         }
//       }
//       if (installQuery.teamId !== undefined) {
//         // fetching single team installation
//         console.log(await keyv.get(installQuery.teamId));
//         return await keyv.get(installQuery.teamId);
//       }
//       throw new Error("Failed fetching installation");
//     },
//   },
// });
//
// app.get("/", (req, res) => res.send("go to /slack/install"));
// app.get("/slack/install", async (req, res, next) => {
//   try {
//     // feel free to modify the scopes
//     const url = await installer.generateInstallUrl({
//       scopes: [
//         "commands",
//         "im:history",
//         // "incoming-webhook",
//         "channels:history",
//         "channels:read",
//         "chat:write",
//       ],
//     });
//     res.send(
//       `<a href=${url}><img alt=""Add to Slack"" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`
//     );
//   } catch (error) {
//     console.log(error);
//   }
// });
//
// // using custom success and failure handlers
// const callbackOptions = {
//   success: (installation, installOptions, req, res) => {
//     res.send("successful!");
//   },
//   failure: (error, installOptions, req, res) => {
//     res.send("failure");
//   },
// };
//
// app.get("/slack/oauth_redirect", async (req, res) => {
//   await installer.handleCallback(req, res, callbackOptions);
// });
//
// app.listen(process.env.PORT || PORT, () =>
//   console.log(
//     `Example app listening on port ${PORT}! Go to https://redirect-server-url.herokuapp.com/slack/install to initiate oauth flow`
//   )
// );

//============================================================================================================

import dotenv from "dotenv";
import KeyvMongoDB from "keyv-mongodb";

dotenv.config();
import pkg from "@slack/bolt";

const { App } = pkg;
import { InstallProvider, LogLevel } from "@slack/oauth";

import Keyv from "keyv";
import mongoose from "mongoose";

const PORT = 3000;
// mongoose.connect(process.env.DB_URL, {
//   useUnifiedTopology: true,
//   useNewUrlParser: true,
// });
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
    // "channels:read",
    // "groups:read",
    // "channels:manage",
    // "chat:write",
    // "incoming-webhook",
    //
    "channels:history",
    "channels:manage",
    "channels:read",
    "chat:write",
    "commands",
    "im:history",
    "users:read",
    "users:read.email",
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

//
// botToken?: string;
// userToken?: string;
// botId?: string;
// botUserId?: string;
// teamId?: string;
