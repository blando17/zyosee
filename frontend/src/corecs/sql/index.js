import foundations from "./foundations.js";
import constraints from "./constraints.js";
import selectFilter from "./select-filter.js";
import aggregation from "./aggregation.js";
import joins from "./joins.js";
import setOperations from "./set-operations.js";
import subqueries from "./subqueries.js";
import windowFunctions from "./window-functions.js";
import dml from "./dml.js";
import viewsProcedures from "./views-procedures.js";
import puzzles from "./puzzles.js";
import optimisation from "./optimisation.js";

/*
 * The SQL topics, in the order you would build a query.
 *
 * Declare the shape (foundations, constraints), then read from it (select,
 * aggregate, join, set operations, subqueries, windows), then change it (DML),
 * then the stored objects, then the questions you are actually asked.
 *
 * "CLASSIC QUERY PUZZLES" IS A TOPIC ON PURPOSE
 *
 * Nth highest salary, finding and deleting duplicates, the per-department
 * maximum, employees earning more than their manager. These are not a
 * concept — they are a fixed set of questions that get asked over and over,
 * and `Complete SQL.pdf` devotes two whole sections to them. Scattering them
 * across joins, subqueries and window functions would have hidden the fact
 * that they are the thing to practise.
 *
 * Each one carries both answers: the window-function version, and the version
 * that works without window functions, because interviewers sometimes bar
 * them to see whether you know what they are doing for you.
 *
 * WHY THERE IS NO "NORMALISATION" TOPIC HERE
 *
 * The sources mix SQL and DBMS freely — `Complete SQL.pdf` has normalisation,
 * ACID and indexing in among the query questions. Those stay in the DBMS
 * subject: they are about design and guarantees, not about writing a query.
 * SQL keeps the things you type.
 */

const TOPICS = [
  foundations,
  constraints,
  selectFilter,
  aggregation,
  joins,
  setOperations,
  subqueries,
  windowFunctions,
  dml,
  viewsProcedures,
  puzzles,
  optimisation,
];

export default TOPICS;

export function topicById(id) {
  return TOPICS.find((topic) => topic.id === id) || null;
}

export const ALL_QUESTIONS = TOPICS.flatMap((topic) =>
  topic.questions.map((question) => ({ ...question, topicId: topic.id, topicName: topic.name }))
);
