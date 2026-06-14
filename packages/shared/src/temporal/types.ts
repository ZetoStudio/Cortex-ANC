export type HandleClientReplyInput = {
  approvalId: string;
  emailContent: string;
  draft: string;
};

export type ApprovalDecision = {
  approved: boolean;
};

export type IngestInitialDataInput = {
  tenantId: string;
  providers: string[];
};

export type IngestProgress = {
  step: string;
  documentsIndexed: number;
  graphNodes: number;
  percent: number;
};
