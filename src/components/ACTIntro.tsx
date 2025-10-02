import React from 'react';
import { X } from 'lucide-react';

interface ACTIntroProps {
  onClose: () => void;
}

export const ACTIntro: React.FC<ACTIntroProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">About This Exercise</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What is ACT?</h3>
            <p className="text-gray-700 leading-relaxed">
              Acceptance and Commitment Therapy (ACT) is an evidence-based form of psychotherapy that helps people create a rich, meaningful life while accepting the pain that inevitably comes with it. Rather than fighting difficult thoughts and feelings, ACT teaches you to accept them and move forward guided by your values.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Identify Your Values?</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Values are what matter most to you in life—the qualities you want to embody and the directions you want to move in. Unlike goals (which can be completed), values are ongoing directions for living.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Clarifying your values helps you make decisions aligned with what truly matters to you, even when life gets difficult. When you're clear on your values, you can take committed action toward living the life you want.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Use This Tool</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">1. Review Each Value</h4>
                <p className="text-gray-700 text-sm">
                  Read each value and its description. Think about how important this is in your life right now.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">2. Categorize by Importance</h4>
                <p className="text-gray-700 text-sm">
                  Sort values into three tiers: <strong>Very Important</strong>, <strong>Somewhat Important</strong>, and <strong>Not Important</strong>. Be honest—there's no right or wrong answer.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">3. Reflect and Act</h4>
                <p className="text-gray-700 text-sm">
                  Once you've identified your most important values, consider: How are you currently living these values? What small actions could you take to move more in these directions?
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tips for Success</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Trust your gut reaction—your first instinct is often most accurate</li>
              <li>Focus on what matters to <em>you</em>, not what you think should matter</li>
              <li>It's okay if your values differ from others' expectations</li>
              <li>You can limit "Very Important" values to focus on what matters most</li>
              <li>Your values may change over time—that's natural</li>
            </ul>
          </section>

          <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Remember</h3>
            <p className="text-blue-800 text-sm">
              This exercise is about <strong>discovery</strong>, not judgment. There are no wrong answers. The goal is to gain clarity about what truly matters to you so you can live more intentionally.
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};
