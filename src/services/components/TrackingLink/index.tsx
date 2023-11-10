import React, { MouseEventHandler, memo } from "react";
import Link from "next/link";
import { trackEvent } from "firebase-soil/client";

type TProps = {
  text: string;
  eventName: string;
  className?: string;
  metadata?: object;
} & (
  | {
      href: string;
      onClick?: undefined;
    }
  | {
      href?: undefined;
      onClick: MouseEventHandler<HTMLButtonElement>;
    }
);

export const TrackingLink = memo(function TrackingLink({
  text,
  eventName,
  className,
  metadata,
  href,
  onClick,
}: TProps) {
  return href ? (
    <Link href={href}>
      <a className={className} onClick={() => trackEvent(eventName, metadata)}>
        {text}
      </a>
    </Link>
  ) : (
    <button
      className={className}
      type="button"
      onClick={(e) => {
        trackEvent(eventName, metadata);
        onClick?.(e);
      }}
    >
      {text}
    </button>
  );
});
