const { register, next } = require("./extensions-api");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const http = require("http");

const SQS_CLIENT = new SQSClient();
const QUEUE_URL = process.env.SQS_URL;
const MESSAGES = [];

function logMessage(message, level = "INFO") {
  if (
    process.env.EXTENSION_DEBUG &&
    process.env.EXTENSION_DEBUG.toLowerCase() === "true"
  ) {
    console.info(`${new Date().toISOString()} ${level}`, message);
  }
}

function errorMessage(message) {
  logMessage(message, "ERROR");
}

const EventType = {
  INVOKE: "INVOKE",
  SHUTDOWN: "SHUTDOWN",
};

function handleShutdown(event) {
  logMessage("shutdown");
  process.exit(0);
}

function handleInvoke(event) {
  logMessage("invoke");
}

async function sendToSQS() {
  logMessage(`SQS loop started, messages: ${MESSAGES.length}`);
  while (MESSAGES.length > 0) {
    const message = MESSAGES.shift();
    logMessage(`Sending message to SQS: ${JSON.stringify(message)}`);
    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
    };
    try {
      await SQS_CLIENT.send(new SendMessageCommand(params));
      logMessage("Message sent to SQS");
    } catch (err) {
      errorMessage(`Failed to send message to SQS: ${err}`);
    }
  }
}

(async function main() {
  logMessage("Starting server");
  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/analytics") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        const data = JSON.parse(body);
        logMessage("Posting to SQS");
        MESSAGES.push({
          action: data.action,
          timestamp: new Date().toISOString(),
        });

        res.writeHead(200);
        res.end("OK");
      });
    }
  });
  
  server.listen(3000, () => {});

  logMessage("register");
  try {
    const extensionId = await register();
    logMessage(`registered: ${extensionId}`);

    while (true) {
      logMessage("next event");
      const event = await next(extensionId);
      switch (event.eventType) {
        case EventType.SHUTDOWN:
          handleShutdown(event);
          break;
        case EventType.INVOKE:
          handleInvoke(event);
          break;
        default:
          errorMessage(`unknown event: ${event.eventType}`);
      }

      await sendToSQS();
    }
  } catch (error) {
    errorMessage(`Extension loop error: ${error}`);
  }
})();
