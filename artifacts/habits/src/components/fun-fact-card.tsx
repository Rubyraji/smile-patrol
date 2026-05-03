import { getDayOfYear } from 'date-fns';
import { motion } from 'framer-motion';
import type { Kid } from '@/lib/store';

const FACTS = [
  { emoji: '🦷', fact: 'Your teeth are as unique as your fingerprints — no two people have the same set!' },
  { emoji: '🐊', fact: 'Crocodiles can grow up to 3,000 teeth in a lifetime. You only get two sets, so look after them!' },
  { emoji: '💎', fact: 'Tooth enamel is the hardest substance in the human body — even harder than your bones!' },
  { emoji: '🦈', fact: 'Sharks grow a new row of teeth every two weeks. Lucky sharks!' },
  { emoji: '🐘', fact: 'Elephants grow 6 sets of teeth in their lifetime. Each tooth can weigh up to 4 kg!' },
  { emoji: '🌙', fact: 'You make less saliva while you sleep — that\'s why brushing before bed is so important!' },
  { emoji: '🧲', fact: 'Teeth are alive! Inside each tooth are tiny nerves and blood vessels.' },
  { emoji: '🐌', fact: 'Snails have thousands of tiny teeth on their tongue, called a radula. Yikes!' },
  { emoji: '🍬', fact: 'Sugar feeds the bacteria on your teeth, which then make acid. That\'s what causes cavities!' },
  { emoji: '📅', fact: 'The average person spends about 38.5 days brushing their teeth over a lifetime.' },
  { emoji: '👅', fact: 'Your tongue is the strongest muscle in your body relative to its size!' },
  { emoji: '🦷', fact: 'Baby teeth (milk teeth) start forming before you\'re even born!' },
  { emoji: '🌿', fact: 'Before toothbrushes, people cleaned their teeth with twigs and charcoal!' },
  { emoji: '🐋', fact: 'Sperm whales have teeth only on their lower jaw — and they don\'t even use them to chew!' },
  { emoji: '🏆', fact: 'Brushing for 2 minutes removes far more plaque than brushing for just 45 seconds.' },
  { emoji: '🦭', fact: 'Walruses use their huge tusks as handles to haul themselves out of the water!' },
  { emoji: '💧', fact: 'Fluoride in toothpaste helps your enamel re-mineralise after acid attacks. It\'s like armour!' },
  { emoji: '🐟', fact: 'Fish don\'t get cavities because they live in water, not surrounded by sugary snacks!' },
  { emoji: '🪥', fact: 'Dentists recommend replacing your toothbrush every 3 months — or after you\'ve been ill.' },
  { emoji: '😁', fact: 'Smiling uses fewer muscles than frowning. Keep those clean teeth showing!' },
  { emoji: '🧪', fact: 'Plaque is a sticky film of bacteria. Brushing removes it before it hardens into tartar.' },
  { emoji: '🐴', fact: 'You can tell a horse\'s age by its teeth — that\'s where the phrase "long in the tooth" comes from!' },
  { emoji: '⏱️', fact: 'Dentists say 2 minutes of brushing twice a day is all you need to keep cavities away.' },
  { emoji: '🌊', fact: 'Flossing reaches 40% of your tooth surface that your brush simply can\'t get to!' },
  { emoji: '🦁', fact: 'Lions and tigers are carnivores with huge fang teeth called canines — just like yours, but bigger!' },
  { emoji: '🍎', fact: 'Apples are called "nature\'s toothbrush" — chewing them helps clean teeth and stimulate gums.' },
  { emoji: '🐢', fact: 'Turtles have no teeth at all — they use their sharp beaks to cut food instead.' },
  { emoji: '👶', fact: 'Most babies get their first tooth between 4 and 7 months old.' },
  { emoji: '🌟', fact: 'The hardest part of brushing is doing it every single day — but every day counts!' },
  { emoji: '🦴', fact: 'Teeth are not bones — they can\'t heal themselves, so protecting them is extra important!' },
];

interface Props {
  kid: Kid;
}

export function FunFactCard({ kid }: Props) {
  const dayIndex = getDayOfYear(new Date());
  const { emoji, fact } = FACTS[dayIndex % FACTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-3xl border bg-card p-4 flex gap-3 items-start shadow-sm"
      data-testid="fun-fact-card"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: `${kid.color}22` }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-wider mb-1"
          style={{ color: kid.color }}
        >
          Did you know? 🦷
        </p>
        <p className="text-sm font-semibold text-foreground leading-snug">{fact}</p>
      </div>
    </motion.div>
  );
}
