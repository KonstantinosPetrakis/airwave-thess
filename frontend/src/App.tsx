import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={(): void => setCount((count) => count + 1)}>
      Current count: {count}
    </button>
  );
}

export default App;
