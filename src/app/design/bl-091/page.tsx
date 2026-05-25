import { Bl091SharedBoardPrototype } from "@/features/design-spikes/bl-091-shared-board-prototype";
import { createPreviewSharedBoardData } from "@/server/shared-board/preview-shared-board";

export const dynamic = "force-dynamic";

export default function Bl091DesignSpikePage() {
  return <Bl091SharedBoardPrototype boardData={createPreviewSharedBoardData()} />;
}
