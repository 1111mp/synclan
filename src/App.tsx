import { AnimatePresence, motion } from 'motion/react';
import { Layout, LoadingScreen } from '@/components';
import { useAppStore } from '@/stores';

function App() {
  const { loading } = useAppStore();
  console.log('loading', loading);

  return (
    <>
      <Layout></Layout>
      <AnimatePresence initial={false}>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
