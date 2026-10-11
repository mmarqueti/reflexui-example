import acme from "../../data/profiles/acme.json";
import globex from "../../data/profiles/globex.json";
import initech from "../../data/profiles/initech.json";
import umbrella from "../../data/profiles/umbrella.json";
import hooli from "../../data/profiles/hooli.json";

export type Plan = "free" | "team" | "enterprise";
export interface AreaSignal {
  anomaly: number;
  visits: number;
  tickets: number;
}
export interface Profile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  story: string;
  ctx: { workspaceId: string; plan: Plan; seats: number; hasSso: boolean };
  areas: Record<string, AreaSignal>;
  topics: string[];
  events: string[];
  w: Record<string, any>;
}

export const profiles = [acme, globex, initech, umbrella, hooli] as unknown as Profile[];
export const profileById = Object.fromEntries(profiles.map((p) => [p.id, p])) as Record<string, Profile>;
