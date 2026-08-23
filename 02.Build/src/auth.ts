import argon2 from "argon2";
import jwt,{ JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import {Request} from "express";

export async function hashPassword(password:string):Promise<string>{
    return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}


export  function makeJWT(userID: string, expiresIn: number, secret: string): string {
  const iat = Math.floor(Date.now()/1000);
  const exp = iat + expiresIn;

  const payload:Pick<JwtPayload , "iss" |"sub"|"iat"|"exp">={
    iss : "chirpy",
    sub : userID,
    iat : iat,
    exp : exp
  };

  return jwt.sign(payload,secret);
}


export function validateJWT(tokenString:string,secret:string):string {
  try {
    const decoded = jwt.verify(tokenString,secret) as JwtPayload;
    if(!decoded.sub){
      throw new Error("Token payload is missing subject (sub) field");
    }

    return decoded.sub
  } catch (err) {
    //Re-throw an error indicating the token signature validation failed
    throw new Error("Invalid or expired token")
  }
}


export function getBearerToken(req:Request):string {
  const authHeader = req.get("Authorization");
  if(!authHeader){
    throw new Error("Missing Authorization header");
  }

  //Ensure it matched the "Bearer" syntax sturcture

  if(!authHeader.startsWith("Bearer ")){
    throw new Error("Invalid authorization header format");
  }
  //strip prefix and trim whitespace wrapping 
  return authHeader.replace("Bearer ","").trim();
}