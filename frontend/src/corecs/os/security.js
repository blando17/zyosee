/*
 * Security and Protection.
 *
 * Source: "Os.pdf" p18 — the only one of the four documents that covers it.
 *
 * Marked GOOD TO KNOW rather than dropped. It is not on your priority list
 * and it is rarely the deciding question in an OS interview, but the
 * authentication-versus-authorisation distinction comes up constantly once
 * the conversation turns to systems design, and it is two sentences to learn.
 */

export default {
  id: "security",
  name: "Security & Protection",
  importance: "low",
  icon: "lock",
  blurb:
    "Who you are, what you may do, and how the OS keeps one user's resources away from another's.",
  source: "Os.pdf p18",

  questions: [
    {
      id: "os-sec-01",
      subtopic: "Basics",
      type: "comparison",
      importance: "med",
      question: "Authentication vs authorisation?",
      short:
        "Authentication answers \"who are you\". Authorisation answers \"what are you allowed to do\". Authentication always comes first.",
      answer: [
        {
          table: {
            head: ["", "Authentication", "Authorisation"],
            rows: [
              ["Question", "Who are you?", "What may you do?"],
              ["Happens", "First", "After authentication"],
              ["Verified with", "Password, biometric, OTP, token", "Roles, permissions, access control lists"],
              ["Example", "Logging in", "Being allowed to delete a file once logged in"],
            ],
          },
        },
        {
          note: "The ordering is not a detail. You cannot decide what someone may do until you know who they are — which is why every authorisation bug starts with an authentication assumption.",
        },
        {
          p: "Common authentication methods: passwords and PINs, biometrics, one-time passwords, smart cards and hardware tokens.",
        },
      ],
      tip: "The one-liner: authentication is the bouncer checking your ID, authorisation is which rooms your wristband opens.",
      tags: ["authentication", "authorisation"],
    },
    {
      id: "os-sec-02",
      subtopic: "Access control",
      type: "comparison",
      importance: "low",
      question: "What are DAC, MAC and RBAC?",
      short:
        "Discretionary: the owner decides. Mandatory: a system policy decides. Role-based: your role decides.",
      answer: [
        {
          table: {
            head: ["Model", "Who decides access", "Example"],
            rows: [
              ["DAC — discretionary", "The resource's **owner**", "UNIX file permissions — you `chmod` your own files"],
              ["MAC — mandatory", "A central **system policy**; owners cannot override it", "Military classification levels, SELinux"],
              ["RBAC — role-based", "Your **role**, not your identity", "Admin, editor, viewer"],
            ],
          },
        },
        {
          p: "**DAC is flexible and leaky** — an owner can grant access to anyone, including by mistake. **MAC is rigid and strict** — not even the owner can relax the policy. **RBAC is the practical middle**, because permissions attach to a job rather than to a person, so someone changing role changes access automatically.",
        },
      ],
      tags: ["dac", "mac", "rbac", "access control"],
    },
    {
      id: "os-sec-03",
      subtopic: "Protection",
      type: "definition",
      importance: "low",
      question: "What is a protection domain?",
      short:
        "A set of objects plus the operations allowed on each — the boundary a process operates inside.",
      answer: [
        {
          p: "A protection domain is a collection of ⟨object, rights⟩ pairs. A process runs inside one, and may only perform the listed operations on the listed objects.",
        },
        {
          p: "It is the general form of what user and kernel mode do concretely: kernel mode is a domain with every right on every object, user mode a far narrower one. Domains can also be switched — which is what `setuid` on UNIX does.",
        },
        {
          note: "The **principle of least privilege** falls straight out of this: give a process the smallest domain that still lets it do its job, so a compromise reaches as little as possible.",
        },
      ],
      tags: ["protection domain", "least privilege"],
    },
    {
      id: "os-sec-04",
      subtopic: "Threats",
      type: "definition",
      importance: "low",
      question: "What are the main types of malware and security threat?",
      short:
        "Virus, worm, trojan, ransomware, spyware, adware — plus unauthorised access, breaches, phishing, DoS and man-in-the-middle.",
      answer: [
        {
          table: {
            head: ["Malware", "Behaviour"],
            rows: [
              ["Virus", "Attaches to a file and spreads when that file runs"],
              ["Worm", "**Self-replicates across a network** with no host file and no user action"],
              ["Trojan horse", "Looks useful, does something malicious"],
              ["Ransomware", "Encrypts data and demands payment"],
              ["Spyware", "Steals information quietly"],
              ["Adware", "Shows unwanted advertising"],
            ],
          },
        },
        {
          note: "**Virus vs worm** is the pair most often asked. A virus needs a host file and a user to run it; a worm needs neither, which is why worms spread so much faster.",
        },
        {
          p: "Broader threats: unauthorised access, data breaches, phishing, denial of service, man-in-the-middle attacks and insider threats.",
        },
      ],
      tags: ["malware", "virus", "worm", "threats"],
    },
    {
      id: "os-sec-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "low",
      question: "UNIX file permissions are an example of which access control model?",
      options: ["MAC", "DAC", "RBAC", "None of these"],
      correct: 1,
      answer: [
        { p: "DAC — the file's owner decides who may access it, at their discretion, with `chmod`." },
      ],
      tags: ["mcq", "dac"],
    },
  ],
};
