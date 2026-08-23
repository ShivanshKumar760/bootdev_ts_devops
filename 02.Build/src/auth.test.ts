import {describe,it,expect,beforeAll} from "vitest";
import { hashPassword,checkPasswordHash,makeJWT,validateJWT } from "./auth.js";

describe("Password Hashing",()=>{
    const password1="correctPassword123";
    let hash1:string;
    beforeAll(async ()=>{
        hash1=await hashPassword(password1);
    })

    it("should return true for the correct password",async ()=>{
        const result = await checkPasswordHash(password1,hash1);
        expect(result).toBe(true);
    });

    it("should return false for an incorrect password",async ()=>{
        const result = await checkPasswordHash("wrong-password",hash1);
        expect(result).toBe(false);
    });
});


describe("JWT Creation and Validation",()=>{
    const userId = "123e4567-e89b-12d3-a456-426614174000";
    const validSecret = "super-secret-key-12345";
    const wrongSecret = "incorrect-secret-key-99999";

    it("should successfully sign and validate a valid token",()=>{
        const token = makeJWT(userId,3600,validSecret);
        const extractedId=validateJWT(token,validSecret);
        expect(extractedId).toBe(userId);
    });

    it("should reject a token signed with the wrong secret key", () => {
        const token = makeJWT(userId, 3600, validSecret);
        expect(() => {
        validateJWT(token, wrongSecret);
        }).toThrow("Invalid or expired token");
    });

    it("should reject a token that has expired", () => {
        // Create an expired token by setting expiresIn parameter to a negative value (-10 seconds)
        const token = makeJWT(userId, -10, validSecret);
        expect(() => {
        validateJWT(token, validSecret);
        }).toThrow("Invalid or expired token");
    });
});