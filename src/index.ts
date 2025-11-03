import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from "discord-interactions";
import express from "express";
import { InteractionBody } from "./types/interaction-types";
import { Endpoints, Env, Names } from "./consts";
import { handleDeleteRotation, handleJoinRotation, handleNewRotation, handleStartRotation } from "./handlers";
import { discordRequest } from "./utils";

const PORT = Env.PORT || 3000;
const app = express();

app.post(
  "/interactions",
  verifyKeyMiddleware(Env.PUBLIC_KEY),
  async (req, res) => {
    const body = req.body as InteractionBody;

    try {
      switch (body.type) {
        case InteractionType.PING: {
          return res.send({ type: InteractionResponseType.PONG });
        }

        case InteractionType.APPLICATION_COMMAND: {
          switch (body.data.name) {
            case Names.NEW_ROTATION: {
              return res.send(await handleNewRotation(body));
            }
            case Names.DELETE_ACTIVE_ROTATION: {
              return res.send(await handleDeleteRotation(body));
            }
            default: {
              console.error(`Unknown command type '${body.data.name}'`);
              return res
                .status(404)
                .json({ error: `Unknown command ${body.data.name}` });
            }
          }
        }

        case InteractionType.MESSAGE_COMPONENT: {
          console.log(body.data);
          const [actionName, rotationId] = body.data.custom_id.split(":");
          switch (actionName) {
            case Names.ACTION_JOIN_ROTATION: {
              return res.send(await handleJoinRotation(body));
            }
            case Names.ACTION_START_ROTATION: {
              return res.send(await handleStartRotation(body));
            }
            case Names.DELETE_ACTIVE_ROTATION: {
              res.send(await handleDeleteRotation(body));
              await discordRequest(Endpoints.MESSAGE(body.token, body.message.id), {
                method: 'DELETE',
              });
              return;
            }
            default: {
              return res
                .status(404)
                .json({
                  error: `Unknown message component ${body.data.custom_id}`,
                });
            }
          }
        }

        default: {
          console.error(`Unknown interaction type '${body.type}'`);
          return res.status(400).json({ error: "unknown interaction type" });
        }
      }
    } catch (err) {
      console.log("Failure while handling interaction:", err);
      return res
        .status(500)
        .json({ error: "unexpected error while processing interaction" });
    }
  }
);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
