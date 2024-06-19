import pino from "pino";
import pretty from "pino-pretty";
import moment from "moment";

const formatTimestamp = () => {
  return moment().format("YYYY-MM-DD HH:mm:ss");
};

const stream = pretty({
  translateTime: "yyyy-mm-dd HH:MM:ss",
});

export const logger = pino(
  {
    base: {
      pid: false,
    },
    timestamp: () => `,"time":"${formatTimestamp()}"`,
  },
  stream
);
