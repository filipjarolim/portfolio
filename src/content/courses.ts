/** Autumn 2026 syllabi, from the public IS MU course pages. First semester, still in progress. */

export type Course = {
  code: string;
  faculty: "FI" | "FSS";
  title: string;
  czech: string;
  meta: string;
  href: string;
  knows: string;
  topics: string[];
};

export const courses: readonly Course[] = [
  {
    code: "BSSb1203",
    faculty: "FSS",
    title: "Introduction to Cybersecurity in Security and Strategic Studies",
    czech: "Úvod do kyberbezpečnosti v pojetí bezpečnostních a strategických studií",
    meta: "5 credits · 1/1 · examination",
    href: "https://is.muni.cz/predmet/fss/podzim2026/BSSb1203",
    knows:
      "Cybersecurity as a security-studies subject. The vocabulary, cyberspace as a geopolitical field, regulation from the world level down to Czech law, and defence at the level of the state.",
    topics: [
      "Security and strategic studies",
      "Geopolitics of cyberspace",
      "EU and Czech regulation",
      "State-level cyber defence",
    ],
  },
  {
    code: "IB000",
    faculty: "FI",
    title: "Mathematical Foundations of Computer Science",
    czech: "Matematické základy informatiky",
    meta: "4 credits · 2/2/1 · examination",
    href: "https://is.muni.cz/predmet/fi/podzim2026/IB000",
    knows:
      "The grammar of a proof. Statements, quantifiers, sets, relations, functions, induction, and the first graphs: connectivity, trees, and distance.",
    topics: ["Propositional and predicate logic", "Sets, relations, functions", "Induction", "Graphs and trees"],
  },
  {
    code: "IB111",
    faculty: "FI",
    title: "Foundations of Programming",
    czech: "Základy programování",
    meta: "5 credits · 2/2/2 · examination",
    href: "https://is.muni.cz/predmet/fi/podzim2026/IB111",
    knows:
      "Python as the first language here. Conditions, loops, functions, lists and dictionaries, then testing, a few classic algorithms, and how expensive they are.",
    topics: ["Python", "Functions and data structures", "Testing", "Complexity of basic algorithms"],
  },
  {
    code: "PB151",
    faculty: "FI",
    title: "Computer Systems",
    czech: "Výpočetní systémy",
    meta: "3 credits · 3/0/0 · examination",
    href: "https://is.muni.cz/predmet/fi/podzim2026/PB151",
    knows:
      "How a machine holds a number. Numeral systems, codes, the processor and its registers, RISC and CISC, cache, IEEE 754, and how that maps onto x86.",
    topics: ["Numeral systems and codes", "Processor and registers", "Cache, RISC and CISC", "IEEE 754"],
  },
  {
    code: "PB168",
    faculty: "FI",
    title: "Introduction to Databases and Information Systems",
    czech: "Základy databázových a informačních systémů",
    meta: "3 credits · 2/2/0 · examination",
    href: "https://is.muni.cz/predmet/fi/podzim2026/PB168",
    knows:
      "A small information system from the model to the query. Entities, relations, normal forms, and the SQL that reads and changes the data.",
    topics: ["Information systems", "Entity-relationship model", "Normal forms", "SQL"],
  },
  {
    code: "VB035",
    faculty: "FI",
    title: "English Skills for IT I",
    czech: "English Skills for IT I",
    meta: "1 credit · 0/2/0 · credit",
    href: "https://is.muni.cz/predmet/fi/podzim2026/VB035",
    knows:
      "English for the field, at B2 and above. Formal mail, a specialised text, a short argument.",
    topics: ["Formal register", "Specialised reading", "Argument and feedback"],
  },
];
