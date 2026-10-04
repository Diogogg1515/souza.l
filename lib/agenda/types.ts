export type VisitStatus = "scheduled" | "done" | "not_done";

export type Visit = {
  id: string;
  clientName: string;
  phone: string | null;
  address: string;
  scheduledAt: string; // data e hora em formato ISO (UTC)
  notes: string | null;
  status: VisitStatus;
};
