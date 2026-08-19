// import express, { NextFunction, Request, Response } from "express";
// import { allowedNodeEnvironmentFlags } from "node:process";
// import { config } from "./config.js";
// const app = express();
// const port = 8080; 

// //1. First Middleware to log the non success status code
// function middlewareLogResponses(req:Request,res:Response,next:NextFunction){
//     res.on("finish",()=>{
//         if(res.statusCode != 200){
//             console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
//         }
//     });
//     next()
// }

// // 2. The Middleware: Increments hits and passes control to the next handler
// function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
//   config.fileserverHits++;
//   next();
// }
// // app.use(express.static("."));

// app.use("/app", middlewareMetricsInc);
// app.use("/app", express.static("./src/app"));
// app.use(middlewareLogResponses);
// app.use(express.json())
// // Explicitly type req and res using the imported types
// const handlerReadiness = (req: Request, res: Response) => {
//     res.set("Content-Type", "text/plain");
//     res.status(200).send("OK");
// };
// // app.use("/app", middlewareMetricsInc); this wont work cause if the request on 
// // the route /app get succefully executed with code 200 the request wont be passed down to next middleware attached to /app route
// app.get("/api/healthz", handlerReadiness);

// // 3. Metrics Handler: Returns "Hits: x" as plain text
// // app.get("/api/metrics", (req: Request, res: Response) => {
// //   res.set("Content-Type", "text/plain");
// //   res.status(200).send(`Hits: ${config.fileserverHits}`);
// // });

// // 4. Reset Handler: Resets the counter back to 0
// // app.get("/api/reset", (req: Request, res: Response) => {
// //   config.fileserverHits = 0;
// //   res.set("Content-Type", "text/plain");
// //   res.status(200).send("Hits reset to 0");
// // });

// //Namespace -> admin 

// app.get("/admin/metrics", (req: Request, res: Response) => {
//   res.set("Content-Type", "text/html");
//   res.status(200).send(`<html>
//   <body>
//     <h1>Welcome, Chirpy Admin</h1>
//     <p>Chirpy has been visited ${config.fileserverHits} times!</p>
//   </body>
// </html>`);
// });


// app.post("/admin/reset", (req: Request, res: Response) => {
//   config.fileserverHits = 0;
//   res.set("Content-Type", "text/plain");
//   res.status(200).send("Hits reset to 0");
// });

// app.post("/api/validate_chirp",(req:Request,res:Response)=>{
//   const {body} = req.body
//   const data:string = body
//   type errorResponseData = {
//     error:string
//   };

//   type successResponseData = {
//     valid:boolean
//   }

//   if(data.length>140){
//     const respBody:errorResponseData = {
//       error:"Chirp is too long"
//     }

//     res.header('Content-Type','application/json');
//     const resBody = JSON.stringify(respBody);
//     return res.status(400).send(resBody)
//   } 
//   const respBody:successResponseData ={
//     valid:true
//   }

//   res.header('Content-Type','application/json');
//   const resBody = JSON.stringify(respBody);
//   return res.status(200).send(resBody)

// });

// app.listen(port, () => {
//     console.log(`Server is running on port: ${port}`);
// });



// import express, { NextFunction, Request, Response } from "express";
// import { allowedNodeEnvironmentFlags } from "node:process";
// import { config } from "./config.js";
// const app = express();
// const port = 8080; 

// // 1. First Middleware to log the non success status code
// function middlewareLogResponses(req:Request,res:Response,next:NextFunction){
//     res.on("finish",()=>{
//         if(res.statusCode != 200){
//             console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
//         }
//     });
//     next()
// }

// // 2. The Middleware: Increments hits and passes control to the next handler
// function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
//   config.fileserverHits++;
//   next();
// }

// app.use("/app", middlewareMetricsInc);
// app.use("/app", express.static("./src/app"));
// app.use(middlewareLogResponses);

// const handlerReadiness = (req: Request, res: Response) => {
//     res.set("Content-Type", "text/plain");
//     res.status(200).send("OK");
// };

// app.get("/api/healthz", handlerReadiness);

// // Namespace -> admin 
// app.get("/admin/metrics", (req: Request, res: Response) => {
//   res.set("Content-Type", "text/html");
//   res.status(200).send(`<html>
//   <body>
//     <h1>Welcome, Chirpy Admin</h1>
//     <p>Chirpy has been visited ${config.fileserverHits} times!</p>
//   </body>
// </html>`);
// });

// app.post("/admin/reset", (req: Request, res: Response) => {
//   config.fileserverHits = 0;
//   res.set("Content-Type", "text/plain");
//   res.status(200).send("Hits reset to 0");
// });

// // Using your custom manual body stream-parsing logic here
// app.post("/api/validate_chirp", (req: Request, res: Response) => {
//   let body = ""; // 1. Initialize

//   // 2. Listen for data events
//   req.on("data", (chunk) => {
//     body += chunk;
//   });

//   // 3. Listen for end events
//   req.on("end", () => {
//     type errorResponseData = {
//       error: string
//     };

//     type successResponseData = {
//       valid: boolean
//     };

//     try {
//       const parsedBody = JSON.parse(body);
//       const data: string = parsedBody.body;

//       // Handle cases where the body is missing altogether or longer than 140 characters
//       if (!data || data.length > 140) {
//         const respBody: errorResponseData = {
//           error: data ? "Chirp is too long" : "Chirp body is required"
//         };

//         res.header('Content-Type', 'application/json');
//         return res.status(400).send(JSON.stringify(respBody));
//       }

//       const respBody: successResponseData = {
//         valid: true
//       };

//       res.header('Content-Type', 'application/json');
//       return res.status(200).send(JSON.stringify(respBody));

//     } catch (error) {
//       // If JSON parsing fails (e.g. malformed JSON text sent by the client)
//       const respBody: errorResponseData = {
//         error: "Invalid JSON"
//       };
//       res.header('Content-Type', 'application/json');
//       return res.status(400).send(JSON.stringify(respBody));
//     }
//   });
// });

// app.listen(port, () => {
//     console.log(`Server is running on port: ${port}`);
// });


import express, { NextFunction, Request, Response } from "express";
import { allowedNodeEnvironmentFlags } from "node:process";
import { config } from "./config.js";
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

app.post("/admin/reset", (req: Request, res: Response) => {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain");
  res.status(200).send("Hits reset to 0");
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




app.use(errorHandler);



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
