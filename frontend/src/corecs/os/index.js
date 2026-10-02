import foundations from "./foundations.js";
import systemCalls from "./system-calls.js";
import processes from "./processes.js";
import threads from "./threads.js";
import cpuScheduling from "./cpu-scheduling.js";
import synchronization from "./synchronization.js";
import deadlocks from "./deadlocks.js";
import memory from "./memory.js";
import virtualMemory from "./virtual-memory.js";
import fileSystems from "./file-systems.js";
import io from "./io-disk.js";
import security from "./security.js";

/*
 * The OS topics, in revision order.
 *
 * NOT THE ORDER OF ANY ONE SOURCE DOCUMENT
 *
 * The 58-page notes run introduction, processes, scheduling, synchronisation,
 * deadlock, IPC, memory, files, disk. The cheat-sheets run in a different
 * order again. Neither is the order you would revise in, because both put
 * system calls in chapter one as a definition and never come back to them,
 * when in an interview they are a whole topic that leans on processes.
 *
 * This order is: what an OS is, how a program talks to it, what a process is,
 * what a thread is, how they get the CPU, how they avoid each other, how they
 * deadlock, how memory works, how it pretends to be bigger, then the storage
 * and I/O topics, then security. Each topic only needs the ones above it.
 *
 * IPC IS NOT A TOPIC HERE
 *
 * The source has a chapter for it, and splitting it was deliberate. Shared
 * memory and message passing are a process-communication idea and live with
 * Processes; pipes, sockets, signals and message queues are things you call
 * and live with System Calls and Linux, which is where they get asked. A
 * separate IPC chapter would have duplicated both.
 */

const TOPICS = [
  foundations,
  systemCalls,
  processes,
  threads,
  cpuScheduling,
  synchronization,
  deadlocks,
  memory,
  virtualMemory,
  fileSystems,
  io,
  security,
];

export default TOPICS;

export function topicById(id) {
  return TOPICS.find((topic) => topic.id === id) || null;
}

/* Every question across every topic, each carrying the topic it came from.
   Built once at module load — the revision queue and the search box both want
   a flat list, and walking twelve arrays on every keystroke is work that has
   exactly one correct answer and never changes. */
export const ALL_QUESTIONS = TOPICS.flatMap((topic) =>
  topic.questions.map((question) => ({ ...question, topicId: topic.id, topicName: topic.name }))
);
