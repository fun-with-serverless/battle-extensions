const baseUrl = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2020-01-01/extension`;

async function register() {
  const res = await fetch(`${baseUrl}/register`, {
    // Lower case method name is not supported by LLRT ¯\_(ツ)_/¯
    method: "POST",
    body: JSON.stringify({
      events: ["INVOKE", "SHUTDOWN"],
    }),
    headers: {
      "Content-Type": "application/json",
      // LLRT does not support __dirname, so using direct name ¯\_(ツ)_/¯
      "Lambda-Extension-Name": "llrt-extension",
    },
  });
  if (!res.ok) {
    console.error("register failed", await res.text());
  }
  // console.info(res.headers);
  return res.headers.get("lambda-extension-identifier");
}

async function next(extensionId) {
  const res = await fetch(`${baseUrl}/event/next`, {
    // Lower case method name is not supported by LLRT ¯\_(ツ)_/¯
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Lambda-Extension-Identifier": extensionId,
    },
  });

  if (!res.ok) {
    console.error("next failed", await res.text());
    return null;
  }

  return await res.json();
}

module.exports = {
  register,
  next,
};
