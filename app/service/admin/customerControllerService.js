import User from "../../models/userSchema.js";
import paginatehelper from "../../helpers/paginate.js";
import websocketHelper from "../../helpers/websocket.js";
import { NotFoundError } from "../../helpers/errorClasses.js";

export const getAllCustomers = async (query) => {
  const { page = 1, limit = 5, search = "" } = query;

  const searchFields = ["username", "name", "email", "phone"];

  const data = await paginatehelper(User, {
    page,
    limit,
    filters: { isAdmin: { $ne: true } },
    search,
    searchFields,
    sort: "-createdAt",
  });

  const pagination = data.pagination || {
    currentPage: Number(page),
    totalPages: 1,
    limit: Number(limit),
    totalDocuments: data.results?.length || 0,
  };

  return { results: data.results || [], pagination };
};

export const blockCustomerService = async (id) => {
  const updateResult = await User.updateOne(
    { _id: id },
    { $set: { isBlocked: true } }
  );

  if (updateResult.matchedCount === 0) {
    throw new NotFoundError("Customer not found");
  }

  try {
    websocketHelper.userBlockUpdate(id);
  } catch (wsErr) {
    console.error("WebSocket notify error:", wsErr);
  }

  return true;
};

export const unblockCustomerService = async (id) => {
  const updateResult = await User.updateOne(
    { _id: id },
    { $set: { isBlocked: false } }
  );

  if (updateResult.matchedCount === 0) {
    throw new NotFoundError("Customer not found");
  }

  return true;
};
