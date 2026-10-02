import foundations from "./foundations.js";
import classesObjects from "./classes-objects.js";
import encapsulation from "./encapsulation.js";
import constructors from "./constructors.js";
import destructors from "./destructors.js";
import inheritance from "./inheritance.js";
import polymorphism from "./polymorphism.js";
import overloading from "./overloading.js";
import virtualFunctions from "./virtual-functions.js";
import abstraction from "./abstraction.js";
import friendTopic from "./friend.js";
import relationships from "./relationships.js";
import advanced from "./advanced.js";

/*
 * The OOPS topics, in the order you would learn them.
 *
 * WHY POLYMORPHISM SITS BETWEEN INHERITANCE AND OVERLOADING
 *
 * Every source treats polymorphism as one chapter and then explains
 * overloading and overriding inside it. That reads fine on paper and is wrong
 * for revision: overloading and overriding are asked as their own questions,
 * they are the pair most often confused, and overriding cannot be understood
 * without inheritance first.
 *
 * So polymorphism keeps a short topic of its own — the concept and the
 * binding rules — and the two mechanisms get a topic each after it. The
 * comparison table lives in Overloading, because that is the question people
 * are actually asked.
 *
 * CONSTRUCTORS AND DESTRUCTORS ARE SEPARATE, NOT ONE TOPIC
 *
 * They are usually taught together as a pair. Splitting them puts copy
 * semantics with constructors, where they belong, and gives virtual
 * destructors, `delete` and memory management room in their own topic —
 * which matters because LIST.pdf stars "delete in C++" and none of the
 * documents covers it properly.
 */

const TOPICS = [
  foundations,
  classesObjects,
  encapsulation,
  constructors,
  destructors,
  inheritance,
  polymorphism,
  overloading,
  virtualFunctions,
  abstraction,
  friendTopic,
  relationships,
  advanced,
];

export default TOPICS;

export function topicById(id) {
  return TOPICS.find((topic) => topic.id === id) || null;
}

export const ALL_QUESTIONS = TOPICS.flatMap((topic) =>
  topic.questions.map((question) => ({ ...question, topicId: topic.id, topicName: topic.name }))
);
