export const autoLogs = (action: string, channelID?: string) => [
  ...(action === "block"
    ? [
        {
          type: 1,
          metadata: {
            customMessage: "Your message was blocked by the automod system.",
          },
        },
      ]
    : action === "alert"
    ? [
        {
          type: 2,
          metadata: {
            channel: channelID,
          },
        },
      ]
    : action === "timeout"
    ? [
        {
          type: 3,
          metadata: {
            durationSeconds: 600,
          },
        },
      ]
    : action === "block_alert"
    ? [
        {
          type: 1,
          metadata: {
            customMessage: "Your message was blocked by the automod system.",
          },
        },
        {
          type: 2,
          metadata: {
            channel: channelID,
          },
        },
      ]
    : action === "alert_timeout"
    ? [
        {
          type: 2,
          metadata: {
            channel: channelID,
          },
        },
        {
          type: 3,
          metadata: {
            durationSeconds: 600,
          },
        },
      ]
    : [
        {
          type: 1,
          metadata: {
            customMessage: "Your message was blocked by the automod system.",
          },
        },
        {
          type: 2,
          metadata: {
            channel: channelID,
          },
        },
        {
          type: 3,
          metadata: {
            durationSeconds: 600,
          },
        },
      ]),
];
