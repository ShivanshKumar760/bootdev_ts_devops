// import {drizzle} from "drizzle-orm/postgres-js";
// import postgres from "postgres"


// import * as schema from "./schema.js";
// import { config } from "../config.js";


// const conn = postgres(config.dbURL);
// export const db = drizzle(conn,{schema})

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";
import { config } from "../config.js";

// Target config.db.url instead of config.dbURL
const conn = postgres(config.db.url);
export const db = drizzle(conn, { schema });
