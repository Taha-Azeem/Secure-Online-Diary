import React from 'react';

export default function PricingHero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[30vh] text-center text-white overflow-hidden">
      <div className="hero-bg" />
      <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold gradient-heading">
        Secure Pricing Plans
      </h1>
      <p className="relative z-10 mt-4 max-w-xl text-base md:text-lg opacity-80">
        Choose the level of protection that fits your needs. All plans include military‑grade encryption and zero‑knowledge architecture.
      </p>
    </section>
  );
}
