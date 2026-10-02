import osTopics from "./os/index.js";
import oopsTopics from "./oops/index.js";
import dbmsTopics from "./dbms/index.js";
import sqlTopics from "./sql/index.js";
import cnTopics from "./cn/index.js";

/*
 * The subjects this section covers, and which of them have content.
 *
 * WHY THE UNBUILT ONES ARE LISTED AT ALL
 *
 * Four of the five are empty. Hiding them until they are ready would be the
 * tidy choice and it would be the wrong one: somebody opening this section
 * wants to know whether it is worth coming back to, and a page showing one
 * subject reads like the whole plan rather than a fifth of it. Listed and
 * honestly marked "not yet" answers that question in one glance.
 *
 * They are also not dead weight — `topics: null` is what every screen checks,
 * so adding DBMS later is a content folder and one line here.
 */

export const SUBJECTS = [
  {
    id: "os",
    name: "Operating Systems",
    short: "OS",
    icon: "gear",
    blurb: "Processes, scheduling, deadlocks, memory and virtual memory.",
    topics: osTopics,
  },
  {
    id: "oops",
    name: "Object-Oriented Programming",
    short: "OOPS",
    icon: "package",
    blurb: "The four pillars, virtual functions, constructors and access control.",
    topics: oopsTopics,
  },
  {
    id: "dbms",
    name: "Database Management",
    short: "DBMS",
    icon: "books",
    blurb: "Normalisation, indexing, B+ trees, ACID and two-phase locking.",
    topics: dbmsTopics,
  },
  {
    id: "sql",
    name: "SQL",
    short: "SQL",
    icon: "search",
    blurb: "Joins, queries, aggregation and where SQL stops being the right tool.",
    topics: sqlTopics,
  },
  {
    id: "cn",
    name: "Computer Networks",
    short: "CN",
    icon: "signal",
    blurb: "OSI and TCP/IP, addressing, subnetting, TCP vs UDP, DNS and DHCP.",
    topics: cnTopics,
  },
];

export function subjectById(id) {
  return SUBJECTS.find((subject) => subject.id === id) || null;
}
