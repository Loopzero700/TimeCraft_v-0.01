import { json } from "express";
import { WebSocketServer } from "ws";

const clients = new Map();
let wss;

function init(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    clients.set(ws, {});

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.event === "viewing_product" && data.productId) {
          const clientInfo = clients.get(ws);
          if (clientInfo) {
            clientInfo.productId = data.productId;
          }
        } else if (data.event === "viewing_shop") {
          const clientInfo = clients.get(ws);
          if (clientInfo) {
            clientInfo.event = data.event;
            console.log("shop");
          }
        } else if (data.event === "user_in_login" && data.userId) {
          const clientInfo = clients.get(ws);
          if (clientInfo) {
            clientInfo.userId = data.userId;
          }
        } else if (data.event === "viewing_home") {
          const clientInfo = clients.get(ws);
          if (clientInfo) {
            clientInfo.event = data.event;
            console.log("home");
          }
        } else if (data.event === "viewing_wishlist") {
          const clientInfo = clients.get(ws);
          if (clientInfo) {
            clientInfo.event = data.event;
            console.log("in wishlist");
          }
        }
      } catch (e) {
        console.error("Error parsing client message:", e);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  console.log("WebSocket helper initialized.");
}

function productStatusUpdate(productId) {
  if (!wss) return;

  const message = JSON.stringify({ event: "product_blocked" });

  for (const [client, info] of clients.entries()) {
    if (info.productId === productId && client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

function productUpdateShop() {
  if (!wss) return;

  const message = JSON.stringify({ event: "product_blocked" });

  for (const [client, info] of clients.entries()) {
    if (info.event === "viewing_shop" && client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

function userBlockUpdate(userId) {
  if (!wss) return;

  const message = JSON.stringify({ event: "user_blocked" });

  for (const [client, info] of clients.entries()) {
    if (info.userId === userId && client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

function homeUpdata() {
  if (!wss) return;

  const message = JSON.stringify({ event: "product_blocked" });

  for (const [client, info] of clients.entries()) {
    if (info.event === "viewing_home" && client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

function wishlistUpdata() {
  if (!wss) return;

  const message = JSON.stringify({ event: "product_blocked" });

  for (const [client, info] of clients.entries()) {
    if (
      info.event === "viewing_wishlist" &&
      client.readyState === client.OPEN
    ) {
      client.send(message);
    }
  }
}

export {
  init,
  productStatusUpdate,
  productUpdateShop,
  userBlockUpdate,
  homeUpdata,
  wishlistUpdata,
};

// keep default export for backwards-compatibility
export default {
  init,
  productStatusUpdate,
  productUpdateShop,
  userBlockUpdate,
  homeUpdata,
  wishlistUpdata,
};
