import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getBidAmounts } from "@/lib/bid";
const registration = z.object({fullName:z.string().trim().min(2).max(120),email:z.string().trim().email().max(254),password:z.string().min(8).max(128)});
const login = z.object({email:z.string().email().max(254),password:z.string().min(1).max(128)});
const bid = z.object({auctionId:z.number().int().positive(),amount:z.number().positive().finite()});
describe("server input validation",()=>{
 it("accepts valid registration and rejects weak password",()=>{expect(registration.safeParse({fullName:"Ada Lovelace",email:"ada@example.com",password:"strong-pass"}).success).toBe(true);expect(registration.safeParse({fullName:"A",email:"ada@example.com",password:"short"}).success).toBe(false)});
 it("rejects malformed login credentials",()=>{expect(login.safeParse({email:"bad",password:"x"}).success).toBe(false)});
 it("requires a positive bid and a positive integer auction id",()=>{expect(bid.safeParse({auctionId:1,amount:100}).success).toBe(true);expect(bid.safeParse({auctionId:1,amount:0}).success).toBe(false);expect(bid.safeParse({auctionId:0,amount:100}).success).toBe(false)});
 it("uses the highest bid or base price and sets the next minimum one higher",()=>{expect(getBidAmounts(240000,200000)).toEqual({previousHighest:240000,minimumNextBid:240001});expect(getBidAmounts(0,200000)).toEqual({previousHighest:200000,minimumNextBid:200001})});
});
