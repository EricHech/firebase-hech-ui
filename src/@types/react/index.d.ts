import React from "react";

declare module "react" {
  export interface CSSProperties {
    "--listItemMinHeightPx"?: number;
    "--listItemMinWidthPx"?: number;
  }
}
