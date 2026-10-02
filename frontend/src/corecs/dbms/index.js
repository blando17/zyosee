import foundations from "./foundations.js";
import erModel from "./er-model.js";
import relationalModel from "./relational-model.js";
import keys from "./keys.js";
import normalization from "./normalization.js";
import denormalization from "./denormalization.js";
import transactions from "./transactions.js";
import concurrencyProblems from "./concurrency-problems.js";
import serializability from "./serializability.js";
import locking from "./locking.js";
import isolationLevels from "./isolation-levels.js";
import indexing from "./indexing.js";
import scaling from "./scaling.js";

/*
 * The DBMS topics, in design-then-runtime order.
 *
 * The first six are how you shape the data; the next five are what happens
 * when several people touch it at once; the last two are how it performs and
 * how it survives.
 *
 * SQL IS A SEPARATE SUBJECT, NOT A TOPIC HERE
 *
 * Every source document mixes them — the cheat-sheets put SQL basics, queries,
 * operators, grouping, joins and subqueries in the middle of the DBMS set, and
 * the "Top 100 DBMS" file is mostly SQL Server questions. They are kept apart
 * because `LIST.pdf` lists them as separate subjects, and because they are
 * asked separately: DBMS questions are about design and guarantees, SQL
 * questions are about writing a query that returns the right rows.
 *
 * CONCURRENCY IS FOUR TOPICS, NOT ONE
 *
 * The sources treat "transactions and concurrency control" as a single
 * chapter. Split here into the problems, the theory that defines safety, the
 * mechanism that enforces it, and the dial you actually set — because those
 * are four separate interview questions, and the middle two are where answers
 * usually fall apart.
 */

const TOPICS = [
  foundations,
  erModel,
  relationalModel,
  keys,
  normalization,
  denormalization,
  transactions,
  concurrencyProblems,
  serializability,
  locking,
  isolationLevels,
  indexing,
  scaling,
];

export default TOPICS;

export function topicById(id) {
  return TOPICS.find((topic) => topic.id === id) || null;
}

export const ALL_QUESTIONS = TOPICS.flatMap((topic) =>
  topic.questions.map((question) => ({ ...question, topicId: topic.id, topicName: topic.name }))
);
