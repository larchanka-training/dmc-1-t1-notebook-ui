import { AppRouter } from "./router/AppRouter";
import { BlockedRequestBanner } from "../shared/ui/BlockedRequestBanner";

function App() {
  return (
    <>
      <AppRouter />
      <BlockedRequestBanner />
    </>
  );
}

export default App;
