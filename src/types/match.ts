export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export type FootballMatch = {
  id: string;
  leagueId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
};
