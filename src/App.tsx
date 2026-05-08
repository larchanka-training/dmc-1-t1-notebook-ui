import "./App.css";

const starterTasks = [
  "Define your app goal in one sentence.",
  "Create your first feature component.",
  "Connect real data or mock API responses."
];

function App() {
  return (
    <main className="app">
      <section className="card">
        <h1>Modern Software Development: React Starter</h1>
        <p>
          This template gives you a clean baseline. Replace this screen with
          your project and extend the setup as needed.
        </p>

        <h2>Suggested first steps</h2>
        <ol>
          {starterTasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}

export default App;
