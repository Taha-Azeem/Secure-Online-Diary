import React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type Stat = {
  label: string;
  value: string;
  tone?: 'primary' | 'secondary' | 'neutral' | 'danger';
};

type Action = {
  label: string;
  to: string;
};

type DetailCard = {
  title: string;
  body: string;
  icon: LucideIcon;
};

interface ModulePageProps {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  stats: Stat[];
  actions?: Action[];
  cards: DetailCard[];
}

const toneClasses: Record<NonNullable<Stat['tone']>, string> = {
  primary: 'text-primary-fixed-dim',
  secondary: 'text-secondary',
  neutral: 'text-on-surface',
  danger: 'text-error',
};

export default function ModulePage({
  badge,
  title,
  description,
  icon: Icon,
  stats,
  actions = [],
  cards,
}: ModulePageProps) {
  return (
    <div className="mx-auto max-w-container-max-width px-4 py-6 sm:px-6 md:px-margin-lg md:py-8">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-6 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(112,0,255,0.12),transparent_30%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr,0.7fr] lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-container/20 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-secondary">
              <Icon size={14} />
              {badge}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.02em] text-primary sm:text-4xl md:text-[56px]">{title}</h1>
              <p className="max-w-2xl font-[var(--font-body)] text-sm leading-7 text-on-surface-variant sm:text-base md:text-lg">{description}</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              {actions.map((action, index) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className={
                    index === 0
                      ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container px-6 py-4 text-sm font-bold text-on-primary shadow-[0_10px_24px_rgba(0,218,243,0.24)] transition-all hover:-translate-y-0.5 sm:w-auto'
                      : 'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant px-6 py-4 text-sm font-bold text-on-surface transition-all hover:bg-surface-variant/20 sm:w-auto'
                  }
                >
                  {action.label}
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-panel isometric-card rounded-[1.75rem] p-5 sm:p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/15 text-primary-fixed-dim shadow-[0_0_24px_rgba(0,218,243,0.18)]">
                <Icon size={30} />
              </div>
              <span className="rounded-full border border-primary-fixed-dim/30 bg-primary-fixed-dim/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary-fixed-dim">
                Live
              </span>
            </div>
            <div className="space-y-4">
              {stats.slice(0, 3).map((stat, index) => (
                <div key={stat.label} className="rounded-2xl border border-white/6 bg-surface-container-lowest/50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">{stat.label}</span>
                    <span className={`text-sm font-bold ${toneClasses[stat.tone || 'neutral']}`}>{stat.value}</span>
                  </div>
                  <div className="neon-track mt-3 h-2">
                    <div className="neon-bar h-full" style={{ width: `${88 - index * 12}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel glass-panel-hover rounded-[1.5rem] p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">{stat.label}</p>
            <p className={`mt-3 text-2xl font-extrabold sm:text-3xl ${toneClasses[stat.tone || 'neutral']}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {cards.map((card) => {
          const CardIcon = card.icon;
          return (
            <article key={card.title} className="glass-panel glass-panel-hover isometric-card rounded-[1.75rem] p-5 sm:p-6">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed-dim/10 text-primary-fixed-dim">
                <CardIcon size={24} />
              </div>
              <h2 className="text-xl font-bold text-on-surface sm:text-2xl">{card.title}</h2>
              <p className="mt-3 font-[var(--font-body)] text-sm leading-7 text-on-surface-variant">{card.body}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
