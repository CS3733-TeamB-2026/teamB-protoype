import { prisma } from "./lib/prisma"
import * as p from "./generated/prisma/client";
import { supabase } from './lib/supabase'
import bcrypt from "bcrypt"
const bucket = "content"

