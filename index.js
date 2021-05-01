import dotenv from "dotenv";
import KeyvMongoDB from "keyv-mongodb";

dotenv.config();
import { InstallProvider, LogLevel } from "@slack/oauth";
import express from "express";
import Keyv from "keyv";
import mongoose from "mongoose";

const app = express();
const PORT = 3000;
mongoose.connect(process.env.DB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
const keyv = new Keyv({
  store: new KeyvMongoDB({ mongooseConnection: mongoose.connection }),
});
keyv.on("error", (err) => console.log("Connection Error", err));

const installer = new InstallProvider({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  authVersion: "v2",
  stateSecret: "my-state-secret",

  logLevel: LogLevel.DEBUG,
  installationStore: {
    storeInstallation: async (installation) => {
      if (installation.isEnterpriseInstall) {
        // storing org installation
        return await keyv.set(installation.enterprise.id, installation);
      } else if (
        installation.team !== null &&
        installation.team.id !== undefined
      ) {
        // storing single team installation
        return await keyv.set(installation.team.id, installation);
      }
      throw new Error("Failed saving installation data to installationStore");
    },
    fetchInstallation: async (installQuery) => {
      if (installQuery.isEnterpriseInstall) {
        if (installQuery.enterpriseId !== undefined) {
          // fetching org installation
          return await keyv.get(installQuery.enterpriseId);
        }
      }
      if (installQuery.teamId !== undefined) {
        // fetching single team installation
        return await keyv.get(installQuery.teamId);
      }
      throw new Error("Failed fetching installation");
    },
  },
});

app.get("/", (req, res) => res.send("go to /slack/install"));
app.get("/slack/install", async (req, res, next) => {
  try {
    // feel free to modify the scopes
    const url = await installer.generateInstallUrl({
      scopes: [
        "commands",
        "im:history",
        "incoming-webhook",
        "channels:history",
        "channels:read",
        "conversation:history",
      ],
    });
    res.send(
      `<a href=${url}><img alt=""Add to Slack"" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`
    );
  } catch (error) {
    console.log(error);
  }
});

// using custom success and failure handlers
const callbackOptions = {
  success: (installation, installOptions, req, res) => {
    res.send("successful!");
  },
  failure: (error, installOptions, req, res) => {
    res.send("failure");
  },
};

app.get("/slack/oauth_redirect", async (req, res) => {
  await installer.handleCallback(req, res, callbackOptions);
});

app.listen(process.env.PORT || PORT, () =>
  console.log(
    `Example app listening on port ${PORT}! Go to https://redirect-server-url.herokuapp.com/slack/install to initiate oauth flow`
  )
);
