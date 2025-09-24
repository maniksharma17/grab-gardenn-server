import { UserDocument } from "../models/user.model"; // adjust path

declare global {
  namespace Express {
    export interface Request {
      user?: UserDocument; // added by your auth middleware
      cookies: { [key: string]: string }; // populated by cookie-parser
    }
  }
}
