const { register, next } = require("./extensions-api");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const net = require("net");

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

class Response {
  #socket;

  constructor(socket) {
    this.#socket = socket;
  }

  json(data, type = "application/json", status = 200) {
    if (typeof status === "number") {
      this.send(SON.stringify(data), type, status);
    } else {
      throw TypeError("Status is not a number");
    }
  }

  send(data, type, status) {
    this.#socket.write(
      `HTTP/1.1 ${status}\r\nContent-Type: ${type}\r\n\r\n${data}`
    );
  }

  ok() {
    this.send("", "text/plain", 200);
  }
}
class SimpleHttp {
  constructor() {
    this.routes = { GET: {}, POST: {} };
  }

  get(path, callback) {
    this.routes.GET[path] = callback;
  }

  post(path, callback) {
    this.routes.POST[path] = callback;
  }

  listen(port, callback) {
    const server = net.createServer((socket) => {
      socket.on("data", (data) => {
        const [requestHeader, ...bodyContent] = data
          .toString()
          .split("\r\n\r\n");

        const [firstLine, ...otherLines] = requestHeader.split("\n");
        const [method, path, httpVersion] = firstLine.trim().split(" ");
        const headers = Object.fromEntries(
          otherLines
            .filter((_) => _)
            .map((line) => line.split(":").map((part) => part.trim()))
            .map(([name, ...rest]) => [name, rest.join(" ")])
        );

        var body = bodyContent[0];
        if (
          headers["Content-Type"] === "application/json" &&
          bodyContent.length > 0
        ) {
          try {
            body = JSON.parse(body);
          } catch (err) {
            errorMessage(err);
          }
        }

        const request = {
          method,
          path,
          httpVersion,
          headers,
          body,
        };
        logMessage(request);
        if (!(method in this.routes)) {
          logMessage("405 Method Not Allowed");
          socket.write(
            "HTTP/1.1 405\n\nContent-Type: text/plain\n\nMethod Not Allowed"
          );
        } else {
          if (request.path in this.routes[method]) {
            logMessage(`Found route '${request.path}' for method '${method}'`);
            const res = new Response(socket);
            this.routes[method][request.path](request, res);
          } else {
            logMessage("404 Not Found");
            socket.write(
              "HTTP/1.1 404\n\nContent-Type: text/plain\n\nNot Found"
            );
          }
        }
        socket.end();
      });
    });
    logMessage("Server is running on port " + port);
    server.listen({ port }, callback);
  }
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
  const server = new SimpleHttp();
  server.post("/analytics", (req, res) => {
    logMessage("Posting to SQS");
    MESSAGES.push({
      action: req.body.action,
      timestamp: new Date().toISOString(),
    });
    res.ok();
  });
  server.listen(3001, () => {});

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
