import { useEffect } from 'react';
import { motion } from 'motion/react';
import AppleMascot from './AppleMascot';
import confetti from 'canvas-confetti';

interface CompletionProps {
  perspective: string;
  aiReflection?: string;
  loadingAi?: boolean;
  aiError?: string;
  onContinue: () => void;
}

export default function Completion({
  perspective,
  aiReflection,
  loadingAi,
  aiError,
  onContinue,
}: CompletionProps) {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#F1C6D9', '#AED7D3', '#C3D162'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#F1C6D9', '#AED7D3', '#C3D162'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="min-h-full px-4 py-8 sm:px-6 sm:py-10">
      <motion.div
        className="mx-auto flex min-h-full w-full max-w-2xl items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col items-center gap-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <AppleMascot emotion="proud" size="lg" />
          </motion.div>

          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h1 className="text-4xl text-[#3d3244]">Wonderful Work! 🌟</h1>
            <p className="text-lg text-[#B5A4AC] max-w-xl mx-auto">
              You've taken an important step toward a more balanced perspective
            </p>
          </motion.div>

          <motion.div
            className="w-full bg-white/90 backdrop-blur-sm rounded-3xl p-8 space-y-6 border border-[#F1C6D9]/20 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="space-y-3">
              <h2 className="text-xl text-[#3d3244]">Your Balanced Perspective</h2>
              <div className="bg-gradient-to-br from-[#C3D162]/30 to-[#AED7D3]/30 rounded-2xl p-6 border border-[#F1C6D9]/20">
                <p className="text-[#3d3244] leading-relaxed italic">"{perspective}"</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl text-[#3d3244]">AI Balanced Reflection</h2>
              <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#AED7D3]/30">
                {loadingAi && (
                  <p className="text-[#B5A4AC] text-sm">
                    Perspekta is creating a realistic balanced reflection...
                  </p>
                )}

                {!loadingAi && aiReflection && (
                  <p className="text-[#3d3244] leading-relaxed">{aiReflection}</p>
                )}

                {!loadingAi && aiError && (
                  <p className="text-[#B5A4AC] text-sm">{aiError}</p>
                )}
              </div>
            </div>

            <div className="bg-[#ffffff] rounded-2xl p-6 space-y-3">
              <h3 className="font-medium text-[#3d3244]">What Happens Next?</h3>
              <p className="text-[#B5A4AC] text-sm">
                To prevent rumination and give your mind space to rest, Perspekta will enter
                Reflection Mode. During this time, you'll be encouraged to step away from the
                screen and engage with real-world activities.
              </p>
              <p className="text-[#B5A4AC] text-sm">
                Remember: thoughts may still appear throughout the day, and that's okay. You've
                already done the meaningful work of reflection.
              </p>
            </div>
          </motion.div>

          <motion.button
            className="px-8 py-4 bg-[#F1C6D9] text-white rounded-full hover:bg-[#e5b0c7] transition-colors shadow-sm"
            onClick={onContinue}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue to Reflection Mode
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}