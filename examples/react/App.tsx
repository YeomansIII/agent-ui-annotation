import { AgentUIAnnotation, useAgentUIAnnotation } from 'agent-ui-annotation/react';
import { initI18n } from 'agent-ui-annotation';

// Optional: Initialize i18n at app startup. Not needed if using English (default).
// Change locale to 'zh-CN' for Chinese, or omit this call entirely for English.
initI18n({ locale: 'en' });

export default function App() {
  const { ref, activate, copyOutput } = useAgentUIAnnotation();

  const CTAButton = ({ label }: { label: string }) => (
    <button className="cta-button">{label}</button>
  );

  const HeroSection = () => (
    <section className="hero">
      <h2>Ship UI changes faster</h2>
      <p>Annotate real UI elements with precision and context.</p>
      <CTAButton label="Start annotating" />
    </section>
  );

  const LandingPage = () => (
    <div className="landing">
      <HeroSection />
    </div>
  );

  return (
    <>
      <h1>Agent UI Annotation - React</h1>
      <button onClick={activate}>Activate</button>
      <button onClick={() => copyOutput()}>Copy Output</button>

      <LandingPage />

      <AgentUIAnnotation
        ref={ref}
        theme="auto"
        outputLevel="standard"
        onAnnotationCreate={(a) => console.log('Created:', a)}
        onCopy={(content) => console.log('Copied:', content)}
      />
    </>
  );
}
