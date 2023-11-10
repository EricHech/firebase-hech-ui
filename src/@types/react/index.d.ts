import React from "react";

declare module "react" {
  export interface CSSProperties extends React.CSSProperties {
    "--listItemMinHeight"?: string;
    "--listItemMinWidth"?: string;
  }
}
