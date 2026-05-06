// Injects the design tokens + component styles for the preview frame
// using the SAME strings shown in the Rules stage. Single source of truth.
import { PREVIEW_TOKENS, PREVIEW_COMPONENTS } from "@/lib/preview-styles";

export function PreviewStyles() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREVIEW_TOKENS }} />
      <style dangerouslySetInnerHTML={{ __html: PREVIEW_COMPONENTS }} />
    </>
  );
}
