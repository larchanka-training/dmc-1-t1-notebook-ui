import { type ReactNode } from "react";
import { Link } from "react-router-dom";

export function HelpPage() {
  return (
    <div className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            ← Back to notebooks
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Documentation
          </h1>
          <p className="mt-3 text-base text-stone-500 leading-relaxed">
            Your workspace provides an isolated, client-side JavaScript execution environment
            running directly inside your browser using background Web Workers. Review how variable
            scopes, asynchronous tasks, and execution rules operate to get the most out of your
            notebooks.
          </p>
        </div>

        <div className="flex flex-col gap-8">

          {/* Section 1 */}
          <Section
            number="1"
            title="Variable Scopes Across Cells"
            subtitle="var vs. let / const"
          >
            <p className="text-stone-600 leading-relaxed">
              To mimic a continuous notebook experience while maintaining clean code boundaries, we
              handle variable declarations differently based on how they are defined.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <FeatureRow
                badge="var"
                badgeColor="blue"
                label="Global Persistence"
                description="Variables declared with var at the top level of a cell are saved to the
                  notebook's global state. They will be accessible in any subsequent cells you run."
              />
              <FeatureRow
                badge="let / const"
                badgeColor="purple"
                label="Cell-Isolated"
                description="Variables declared with let or const are block-scoped to the cell they
                  are written in. They cannot be accessed by other cells."
              />
            </div>

            <WarningBox>
              This behavior only applies to <strong>top-level declarations</strong>. If you declare
              a <code>var</code> inside a function, an <code>if</code> statement, or a{" "}
              <code>for</code> loop, it follows standard JavaScript scoping rules and will not leak
              globally.
            </WarningBox>

            <CodeBlock
              caption="Example — cross-cell variable access"
              code={`// CELL 1
var persistentUser = "Alice";
let localToken = "12345";

// CELL 2
console.log(persistentUser); // Output: "Alice"
console.log(localToken);      // ReferenceError: localToken is not defined`}
            />
          </Section>

          {/* Section 2 */}
          <Section
            number="2"
            title="Execution and Asynchronous Code"
          >
            <p className="text-stone-600 leading-relaxed">
              A cell is not considered finished until its synchronous code completes{" "}
              <em>and</em> all triggered asynchronous tasks — such as{" "}
              <code>fetch()</code> requests or <code>setTimeout</code> delays — have entirely
              finished processing.
            </p>
            <p className="mt-3 text-stone-600 leading-relaxed">
              If an asynchronous task prints to the console after a delay, it will be accurately
              captured and displayed under the cell that initiated it.
            </p>

            <CodeBlock
              caption="Example — async output is captured"
              code={`// CELL 1
setTimeout(() => {
  console.log("This prints after 500 ms, still under Cell 1");
}, 500);

console.log("This prints first");`}
            />
          </Section>

          {/* Section 3 */}
          <Section
            number="3"
            title="Error Handling and State Safety"
          >
            <p className="text-stone-600 leading-relaxed">
              We practice <strong>atomic execution</strong>. If any line of code within a cell
              throws an unhandled error during execution:
            </p>
            <ol className="mt-4 flex flex-col gap-2 pl-5 list-decimal text-stone-600 leading-relaxed">
              <li>Execution halts immediately.</li>
              <li>The error is printed to the cell's output panel.</li>
              <li>
                All state changes attempted by that cell are discarded. Any <code>var</code>{" "}
                assignments made right before the error occurred will be rolled back, ensuring your
                notebook's global context remains unpolluted.
              </li>
            </ol>

            <CodeBlock
              caption="Example — partial assignments are rolled back"
              code={`// CELL 1
var count = 0;

// CELL 2
var count = 99;     // would update count...
undefinedFunction();  // ...but this throws, so count stays 0`}
            />
          </Section>

          {/* Section 4 */}
          <Section
            number="4"
            title="Running and Interrupting Code"
          >
            <div className="flex flex-col gap-4">
              <FeatureRow
                badge="▶▶ Run All"
                badgeColor="green"
                label="Sequential execution"
                description="Use the Run All button in the top toolbar to execute all cells
                  sequentially from top to bottom. The engine waits for each cell — and its
                  asynchronous tasks — to fully resolve before starting the next one."
              />
              <FeatureRow
                badge="■ Stop"
                badgeColor="red"
                label="Interrupt infinite loops"
                description="If your code gets stuck in an infinite loop, your browser tab won't
                  freeze because the engine runs on a separate background thread. Click Stop in the
                  toolbar to terminate the execution environment and spin up a fresh one."
              />
            </div>
          </Section>

          {/* Section 5 */}
          <Section
            number="5"
            title="Environment Restrictions"
          >
            <p className="text-stone-600 leading-relaxed">
              For security and performance reasons the environment operates under strict browser
              sandbox rules.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PermissionCard
                type="allowed"
                items={[
                  "Standard JavaScript runtime features",
                  "fetch() for HTTP requests",
                  "Math and data utilities",
                  "setTimeout / setInterval",
                ]}
              />
              <PermissionCard
                type="blocked"
                items={[
                  "Browser DOM (window, document)",
                  "indexedDB and localStorage",
                  "require() / import statements",
                  "Node.js built-in modules",
                ]}
              />
            </div>
          </Section>

          {/* Section 6 */}
          <Section
            number="6"
            title="Cell Types"
          >
            <p className="text-stone-600 leading-relaxed">
              Notebooks support three distinct cell types, each serving a different purpose.
              You can add, reorder, and delete cells of any type from the cell action bar.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <FeatureRow
                badge="Code"
                badgeColor="blue"
                label="Executable JavaScript"
                description="Write and run JavaScript directly in the browser. Outputs — including
                  console logs, return values, and errors — appear below the cell. Code cells
                  support the full var / let / const scoping rules described in Section 1."
              />
              <FeatureRow
                badge="Markdown"
                badgeColor="purple"
                label="Rich text with live preview"
                description="Write documentation, headings, lists, and inline code using Markdown
                  syntax. The cell renders a live preview on the right side as you type,
                  supporting GitHub-Flavored Markdown (GFM) including tables and task lists."
              />
              <FeatureRow
                badge="Raw"
                badgeColor="amber"
                label="Plain text — no execution or rendering"
                description="A plain text cell with no special treatment. Raw cells are the output
                  target for Browser LLM generation (see Section 8): when you prompt the AI from
                  a Markdown cell, its response is written into the next Raw cell (or a new one
                  is created automatically)."
              />
            </div>
          </Section>

          {/* Section 7 */}
          <Section
            number="7"
            title="AI Code Generation"
            subtitle="Server-side — available on Code cells"
          >
            <p className="text-stone-600 leading-relaxed">
              Click the <strong>✦</strong> button on any <strong>Code</strong> cell to open the
              AI generation modal. Describe what you want to build in plain English and the
              assistant will write the JavaScript code and insert it directly into the cell.
            </p>
            <p className="mt-3 text-stone-600 leading-relaxed">
              The model is context-aware: before generating, the system automatically collects
              the source and outputs of the other cells in your notebook and sends them as
              context, so the generated code can reference variables and data already in scope.
            </p>

            <CodeBlock
              caption="Example — describe your intent, get runnable code"
              code={`// Open the ✦ modal on a Code cell and type:
// "fetch the top 5 posts from the JSONPlaceholder API and log their titles"

// Generated result placed into the cell:
var response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
var posts = await response.json();
posts.forEach(p => console.log(p.title));`}
            />

            <WarningBox>
              AI generation replaces the entire source of the target cell. If the cell already
              has code you want to keep, copy it first or use Undo (<code>Ctrl+Z</code> /{" "}
              <code>⌘Z</code>) after generation.
            </WarningBox>
          </Section>

          {/* Section 8 */}
          <Section
            number="8"
            title="Browser LLM Generation"
            subtitle="Client-side — available on Markdown cells"
          >
            <p className="text-stone-600 leading-relaxed">
              The notebook loads a small language model (<strong>Llama 3.2 1B</strong>) directly
              inside your browser using WebLLM. No data leaves your machine — inference runs
              entirely on your device's GPU or CPU.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <FeatureRow
                badge="preparing"
                badgeColor="amber"
                label="Model is loading"
                description="On first load the model weights are downloaded and cached by the
                  browser. This can take a moment. The spinning indicator in the toolbar shows
                  the current status."
              />
              <FeatureRow
                badge="ready"
                badgeColor="green"
                label="Model is ready"
                description="A green dot in the toolbar confirms the model is loaded and ready.
                  Click ✦ on any Markdown cell to use it."
              />
              <FeatureRow
                badge="error"
                badgeColor="red"
                label="Load failed"
                description="A red dot indicates the model failed to initialise (hover the status
                  for the error message). This can happen if WebGPU is unsupported or if the
                  download was interrupted. Refreshing the page will retry."
              />
            </div>

            <p className="mt-5 text-stone-600 leading-relaxed">
              To use it: write your prompt in a <strong>Markdown</strong> cell, then click the{" "}
              <strong>✦</strong> button. The model treats the cell's text as input and writes its
              response into the next <strong>Raw</strong> cell. If no Raw cell follows, one is
              created automatically.
            </p>

            <CodeBlock
              caption="Example — Markdown cell as prompt, Raw cell receives output"
              code={`// MARKDOWN CELL (your prompt)
Explain the difference between var, let, and const in JavaScript.

// → Click ✦ on the Markdown cell
// → Output is written into the Raw cell below:

// RAW CELL (LLM response)
var is function-scoped and hoisted to the top of its containing function...`}
            />
          </Section>

        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white px-7 py-6 shadow-sm">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
          {number}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          {subtitle && <p className="text-sm text-stone-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

type BadgeColor = "blue" | "purple" | "green" | "red" | "amber";

const badgeClasses: Record<BadgeColor, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
};

function FeatureRow({
  badge,
  badgeColor,
  label,
  description,
}: {
  badge: string;
  badgeColor: BadgeColor;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 px-4 py-3">
      <code
        className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${badgeClasses[badgeColor]}`}
      >
        {badge}
      </code>
      <div>
        <span className="text-sm font-medium text-stone-800">{label} — </span>
        <span className="text-sm text-stone-600">{description}</span>
      </div>
    </div>
  );
}

function WarningBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 leading-relaxed">
      <span className="shrink-0 text-base">⚠️</span>
      <p>{children}</p>
    </div>
  );
}

function CodeBlock({ caption, code }: { caption: string; code: string }) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-stone-200">
      <div className="border-b border-stone-200 bg-stone-100 px-4 py-2 text-xs font-medium text-stone-500">
        {caption}
      </div>
      <pre className="overflow-x-auto bg-stone-950 px-5 py-4 text-sm leading-relaxed text-stone-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function PermissionCard({
  type,
  items,
}: {
  type: "allowed" | "blocked";
  items: string[];
}) {
  const isAllowed = type === "allowed";
  return (
    <div
      className={`rounded-lg border px-4 py-4 ${
        isAllowed
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <p
        className={`mb-3 text-xs font-semibold uppercase tracking-wide ${
          isAllowed ? "text-green-700" : "text-red-700"
        }`}
      >
        {isAllowed ? "✓ Allowed" : "✗ Blocked"}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={`flex items-center gap-2 text-sm ${
              isAllowed ? "text-green-800" : "text-red-800"
            }`}
          >
            <span className="shrink-0 text-xs">{isAllowed ? "●" : "●"}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
