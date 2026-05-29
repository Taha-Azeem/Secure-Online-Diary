import React from 'react';

export default function PricingHero() {
  return (
    <section className="relative flex min-h-[24vh] flex-col items-center justify-center overflow-hidden px-4 py-12 text-center text-white sm:min-h-[30vh] sm:px-6 md:py-16">
      <div className="hero-bg" />
      <h1 className="relative z-10 text-3xl font-extrabold gradient-heading sm:text-4xl md:text-6xl">
        Secure Pricing Plans
      </h1>
      <p className="relative z-10 mt-4 max-w-xl text-sm opacity-80 sm:text-base md:text-lg">
        Choose the level of protection that fits your needs. All plans include military-grade encryption and zero-knowledge architecture.
      </p>
    </section>
  );
}
