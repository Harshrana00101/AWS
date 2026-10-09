import http from "node:http";
import area from "@turf/area";

const port = Number(process.env.PORT ?? 8787);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { status: "ok", service: "climate-selection-api" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/area") {
    try {
      let rawBody = "";
      for await (const chunk of request) rawBody += chunk;
      const payload = JSON.parse(rawBody);
      const squareMeters = area(payload.geometry);

      sendJson(response, 200, {
        areaKm2: Number((squareMeters / 1_000_000).toFixed(2)),
        areaHectares: Number((squareMeters / 10_000).toFixed(2)),
      });
    } catch {
      sendJson(response, 400, { error: "Expected a valid GeoJSON geometry in the request body." });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`Climate selection API listening on http://localhost:${port}`);
});
