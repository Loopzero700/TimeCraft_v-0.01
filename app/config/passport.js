import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userSchema.js";
import "dotenv/config";
import Wallet from "../models/walletSchema.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails?.[0]?.value || null,
            profile_photo:
              profile.photos?.[0]?.value ||
              `https://placehold.co/100x100/dfdcd9/31343C?text=${profile.displayName?.charAt(0)?.toUpperCase()}`,
            isBlocked: false,
          });
          const userWallet = new Wallet({
            user_id: user._id,
            balance: 0,
          });
          await userWallet.save();
        }

        if (user.isBlocked) {
          return done(null, false, {
            message: "Your account is blocked by Admin",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    if (user && user.isBlocked) {
      return done(null, false, { message: "Your account is blocked." });
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
