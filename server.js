import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import express_layout from "express-ejs-layouts";
import userRouter from "./app/routes/userRouter.js";
import adminRouter from "./app/routes/adminRouter.js";
import "dotenv/config";
import db from "./app/config/db.js";
import passport from "./app/config/passport.js";
import morgan from "morgan";
import http from "http";
import logger from "./app/helpers/logger.js";
import { init as websocketInit } from "./app/helpers/websocket.js";
import { NotFoundError } from "./app/helpers/errorClasses.js";
import HttpStatus from "./app/constants/httpStatus.js";
const app = express();

app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

db();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const MaxAgeSession = Number(process.env.SESSION_MAXAGE_USER);
const userSession = session({
  name: "user.sid",
  secret: process.env.SESSION_SECRET + "_user",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: (process.env.NODE_ENV === 'production'),
    httpOnly: true,
    maxAge: MaxAgeSession,
  },
});

const adminSession = session({
  name: "admin.sid",
  secret: process.env.SESSION_SECRET + "_admin",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: (process.env.NODE_ENV === 'production'),
    httpOnly: true,
    maxAge: MaxAgeSession,
  },
});

app.use(morgan("dev"))

function connectToDatabase() {
  try {
    logger.info('Database connected successfully!')
  } catch (err) {
    logger.error('Failed to connect to database:', err.message)
  }
}

connectToDatabase()
logger.warn('This is a warning message.')
logger.debug('This is a debug message (only shows in development).')

app.use((req, res, next) => {
  res.set("cache-control", "no-store");
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express_layout);
app.set("layout", "layouts/main");

app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) {
    adminSession(req, res, next);
  } else {
    userSession(req, res, next);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use("/admin", adminRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  err.message = err.message || "Something went wrong!";

  if (err.statusCode === HttpStatus.NOT_FOUND) {
    if (req.originalUrl.startsWith("/admin")) {
      return res.status(HttpStatus.NOT_FOUND).render("user/pageNotFound", {
        layout: "layouts/admin-layout",
        title: "Page Not Found",
        errorMessage: err.message,
      });
    } else {
      return res.status(HttpStatus.NOT_FOUND).render("user/pageNotFound", {
        title: "Page Not Found",
        errorMessage: err.message,
      });
    }
  }

  res.status(err.statusCode).render("user/400", {
    title: "Error!",
    errorMessage: err.message,
  });
});

const server = http.createServer(app);
websocketInit(server);

server.listen(process.env.PORT, () => {
  console.log(`Server with WebSocket is running on port ${process.env.PORT}`);
});
