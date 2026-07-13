import { holdExpiresIn } from "@slotly/shared";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

interface HoldCountdownProps {
  expiresAt: string;
  onExpired: () => void;
}

export function HoldCountdown({ expiresAt, onExpired }: HoldCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    holdExpiresIn(expiresAt),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = holdExpiresIn(expiresAt);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;

  return (
    <Badge variant={isUrgent ? "destructive" : "warning"}>
      Time left: {minutes}:{seconds.toString().padStart(2, "0")}
    </Badge>
  );
}
