import foundations from "./foundations.js";
import models from "./models.js";
import dataLink from "./data-link.js";
import ipAddressing from "./ip-addressing.js";
import subnetting from "./subnetting.js";
import routing from "./routing.js";
import transport from "./transport.js";
import congestion from "./congestion.js";
import delays from "./delays.js";
import application from "./application.js";

/*
 * The CN topics, bottom of the stack to the top.
 *
 * Foundations and the models first, then one topic per layer as a packet
 * climbs it — data link, IP and subnetting, routing, transport, congestion —
 * with delays and the application layer last.
 *
 * SUBNETTING IS SPLIT OUT FROM IP ADDRESSING
 *
 * The sources treat them as one chapter. They are separated here because
 * `LIST.pdf` stars subnetting **with numericals**, and it is the one CN topic
 * you will be asked to do on paper. Keeping it separate means the borrowing
 * table, the block-size method and four worked examples sit together instead
 * of being buried in a chapter about address classes.
 *
 * DELAYS IS ITS OWN TOPIC FOR THE SAME REASON
 *
 * The 57-page notes give it two pages near the end. Your priority list names
 * propagation delay, RTT, timeout, TTL **and** their numericals as five
 * separate items — so it gets a topic with the formulas, the unit conversions
 * that trip people up, and full working.
 */

const TOPICS = [
  foundations,
  models,
  dataLink,
  ipAddressing,
  subnetting,
  routing,
  transport,
  congestion,
  delays,
  application,
];

export default TOPICS;

export function topicById(id) {
  return TOPICS.find((topic) => topic.id === id) || null;
}

export const ALL_QUESTIONS = TOPICS.flatMap((topic) =>
  topic.questions.map((question) => ({ ...question, topicId: topic.id, topicName: topic.name }))
);
