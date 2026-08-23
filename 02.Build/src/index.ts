
import express, { NextFunction, Request, Response } from "express";
import { allowedNodeEnvironmentFlags, throwDeprecation } from "node:process";
import { config } from "./config.js";


// Migration tool imports
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { createUser,deleteAllUsers, getUserByEmail } from "./db/queries/user.js";
import { createChirp,getAllChirps, getChirpById } from "./db/queries/chirps.js"; // Import your new query
import { saveRefreshToken,getRefreshTokenRecord,revokeRefreshTokenRecord } from "./db/queries/auth.js";
import { checkPasswordHash, hashPassword,makeJWT,validateJWT,getBearerToken,makeRefreshToken } from "./auth.js";
import { User } from "./db/schema.js";

// Run automatic database migrations on startup with a isolated max: 1 client connection
console.log("Running pending database migrations...");

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);
console.log("Database migrations successfully executed!");

const app = express();
const port = 8080; 



class BadRequestError extends Error {
  constructor(message:string){
    super(message);
    this.name = "BadRequestError";
  }
}

class UnauthorizedError extends Error{
  constructor(message:string){
    super(message);
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends Error{
  constructor(message:string){
    super(message);
    this.name = "ForbiddenError";
  }
}


class NotFoundError extends Error{
  constructor(message:string){
    super(message);
    this.name = "NotFoundError";
  }
}


// Enable Express global JSON parsing middleware
app.use(express.json());

// 1. First Middleware to log the non success status code
function middlewareLogResponses(req:Request,res:Response,next:NextFunction){
    res.on("finish",()=>{
        if(res.statusCode != 200){
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
    });
    next()
}

// 2. The Middleware: Increments hits and passes control to the next handler
function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.fileserverHits++;
  next();
}

app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);

const handlerReadiness = (req: Request, res: Response) => {
    res.set("Content-Type", "text/plain");
    res.status(200).send("OK");
};

app.get("/api/healthz", handlerReadiness);

// Namespace -> admin 
app.get("/admin/metrics", (req: Request, res: Response) => {
  res.set("Content-Type", "text/html");
  res.status(200).send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
});

app.post("/admin/reset", async (req: Request, res: Response, next:NextFunction) => {
  // config.fileserverHits = 0;
  // res.set("Content-Type", "text/plain");
  // res.status(200).send("Hits reset to 0");
  try {
    if(config.platform !== "dev"){
      throw new ForbiddenError("Access forbidden");
    }
    config.fileserverHits = 0;
    await deleteAllUsers();
    res.set("Content-type","text/plain");
    return res.status(200).send("Hits reset to 0 and database cleared")
  } catch (error) {
    next(error);
  }
});

// Cleaned up handler using express.json()
app.post("/api/validate_chirp", (req: Request, res: Response) => {
  type errorResponseData = {
    error: string
  };

  type successResponseData = {
    cleanedBody: string
  };

  // req.body is automatically parsed and ready to use
  const data: string = req.body?.body;

  // Length Validation Check
  if (!data || data.length > 140) {
    // const respBody: errorResponseData = {
    //   error: data ? "Chirp is too long" : "Chirp body is required"
    // };
    // return res.status(400).json(respBody);


  // Length Validation Check -> Now explicitly throws an error
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  // Profanity Filter Check
  const profaneWords = ["kerfuffle", "sharbert", "fornax"];
  
  // Split sentence into words, map over them, and clean up matches
  const cleanedWords = data.split(" ").map((word) => {
    if (profaneWords.includes(word.toLowerCase())) {
      return "****";
    }
    return word;
  });

  // Join the words back into a single sentence
  const cleanedBodyString = cleanedWords.join(" ");

  const respBody: successResponseData = {
    cleanedBody: cleanedBodyString
  };

  return res.status(200).json(respBody);
});


// Define safe return payload structure using standard Omit
type UserResponse = Omit<User, "hashedPassword">;

app.post("/api/users",async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const {email,password} = req.body;
    if(!email){
      throw new BadRequestError("Email is required");
    }

    if(!password){
      throw new BadRequestError("Password is required");
    }
    const hashedPassword = await hashPassword(password);
    const newUser = await createUser({email,hashedPassword});
    // const newUser = await createUser({email}); //old
    if(!newUser){
      throw new BadRequestError("User could not be created or already exists");
    }

    const { hashedPassword: _, ...safeUserResponse } = newUser;

    return res.status(201).json(safeUserResponse as UserResponse);
  } catch (error) {
    next(error);
  }
});

// 🚨 Assignment Route: POST /api/login
app.post("/api/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new UnauthorizedError("incorrect email or password");
    }

    // 1. Resolve user profile records matching the email identifier
    const userRecord = await getUserByEmail(email);
    if (!userRecord) {
      throw new UnauthorizedError("incorrect email or password");
    }

    // 2. Compute cryptography matching validity
    const isPasswordValid = await checkPasswordHash(password, userRecord.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError("incorrect email or password");
    }


    //Default expiration setup : 1 hour (3600 seconds)
    let lifespan = 3600;

    //Genrate token payload using custom secret variable
    const accessToken = makeJWT(userRecord.id,lifespan,config.jwtSecret);

    // Refresh Token expires after exactly 60 days
    const refreshTokenString = makeRefreshToken();
    const sixtyDaysFromNow = new Date(Date.now()+60*24*60*60*1000);

    await saveRefreshToken(refreshTokenString,userRecord.id,sixtyDaysFromNow);

    // Strip out credentials before completing payload returns
    const { hashedPassword: _, ...safeUserResponse } = userRecord;

    return res.status(200).json({...safeUserResponse,token:accessToken,refreshToken:refreshTokenString});
  } catch (err) {
    next(err);
  }
});


// 🚨 Assignment Route: POST /api/refresh
app.post("/api/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let tokenString: string;
    try {
      tokenString = getBearerToken(req);
    } catch {
      throw new UnauthorizedError("Missing or malformed authorization header");
    }

    const dbToken = await getRefreshTokenRecord(tokenString);
    
    // Check if token doesn't exist, is expired, or is revoked
    if (!dbToken || new Date() > dbToken.expiresAt || dbToken.revokedAt !== null) {
      throw new UnauthorizedError("Invalid, expired, or revoked refresh token");
    }

    // Generate a fresh 1-hour access token for the subject user
    const newAccessToken = makeJWT(dbToken.userId, 3600, config.jwtSecret);

    return res.status(200).json({
      token: newAccessToken
    });
  } catch (err) {
    next(err);
  }
});

// 🚨 Assignment Route: POST /api/revoke
app.post("/api/revoke", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let tokenString: string;
    try {
      tokenString = getBearerToken(req);
    } catch {
      throw new UnauthorizedError("Missing or malformed authorization header");
    }

    // Flag the record with a current cancellation timestamp
    await revokeRefreshTokenRecord(tokenString);

    // Return a clean 204 No Content response status
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});



app.post("/api/chirps",async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {body} = req.body;
    //1. Extract bearer token from Request context,intercepting schema format exceptions
    let tokenString:string
    try {
      tokenString = getBearerToken(req);
    } catch (error) {
      throw new UnauthorizedError("Missing or malformed header");
    }
    //2. Validate token state signature , throwing 401 if token  is invalid or expired
    let authenticatedUserId:string;
    try {
      authenticatedUserId = validateJWT(tokenString,config.jwtSecret);
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    //3.Complete Character length validation checks
    if(!body || body.length>140){
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    const profaneWords = ["kerfuffle", "sharbert", "fornax"];
    const cleanedWords = body.split(" ").map((word:string)=>{
      if(profaneWords.includes(word.toLowerCase())){
        return "****"
      }
      return word;
    });

    const cleanedBodyString = cleanedWords.join(" ");

    const newChirp = await createChirp({
      body: cleanedBodyString,
      userId: authenticatedUserId,
    });

    if(!newChirp){
      throw new BadRequestError("Chirp could not be saved to the database");
    }
    // Respond with a 201 Created and the camelCase resource structure
    return res.status(201).json(newChirp);
  } catch (error) {
    next(error);
  }
});

app.get("/api/chirps",async (req:Request,res:Response,next:NextFunction)=>{

  try {
    const chirpsList = await getAllChirps();
    return res.status(200).json(chirpsList);
  } catch (error) {
    next(error);
  }
})


// 🚨 Assignment Fix: Error-handling middleware with 4 parameters
// MUST be defined last, right before app.listen
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(err); // Always log the error details

  // Route error types to their respective status boundaries
  if (err instanceof BadRequestError) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: err.message });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({ error: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  // Generic fallback: Do not leak message details for unrecognized/generic errors
  return res.status(500).json({
    error: "Something went wrong on our end"
  });
}


// Assignment Route: GET /api/chirps/:chirpID
app.get("/api/chirps/:chirpId",async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {chirpId} = req.params;
    if (typeof chirpId !== "string") {
      throw new BadRequestError("Invalid chirp ID format");
    }
    const chirp = await getChirpById(chirpId);
    if (!chirp){
      throw new NotFoundError("Chirp not found");
    }

    return res.status(200).json(chirp);
  } catch (error) {
    next(error);
  }
});



app.use(errorHandler);



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
