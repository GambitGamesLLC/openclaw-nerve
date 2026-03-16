export interface PlanChatArtifact {
  title: string;
  path: string;
}

export interface BeadChatArtifact {
  title: string;
  id: string;
}

function formatArtifactBlock(kind: 'Plan' | 'Bead', lines: Array<[label: string, value: string]>): string {
  return [
    `${kind} context:`,
    ...lines.map(([label, value]) => `- ${label}: ${value}`),
  ].join('\n');
}

export function formatPlanAddToChat(plan: PlanChatArtifact): string {
  return formatArtifactBlock('Plan', [
    ['Title', plan.title],
    ['Path', plan.path],
  ]);
}

export function formatBeadAddToChat(bead: BeadChatArtifact): string {
  return formatArtifactBlock('Bead', [
    ['Title', bead.title],
    ['ID', bead.id],
  ]);
}

export function mergeAddToChatText(currentDraft: string, nextBlock: string): string {
  const trimmedDraft = currentDraft.trim();
  if (!trimmedDraft) return nextBlock;

  return `${trimmedDraft}\n\n${nextBlock}`;
}
