'use client';

import { useId, useRef, useState } from 'react';
import { programmeInputSchema, type ProgrammeInput } from '@/lib/programme';
import type { Level, Phase } from '@/lib/types';
import './project-intake-visual.css';

export interface ProjectIntakeProps {
  initial?: ProgrammeInput;
  initialName?: string;
  initialDescription?: string;
  goalOnly?: boolean;
  busy: boolean;
  onSubmit: (name: string, description: string, input: ProgrammeInput) => void;
  onCancel: () => void;
  error?: string;
}

const phaseNames: Record<Phase, string> = { discover: 'Discover', define: 'Define', develop: 'Develop', deliver: 'Deliver', iterate: 'Iterate' };
const phaseRequiredMessage = 'Select at least one phase in the design process.';
// Light rounding: the same six-unit corner softening and 2.2px outline as the chosen preview.
const diamondPath = 'M114.9 7.47 L211.1 75.53 Q216 79 211.1 82.47 L114.9 150.53 Q110 154 105.1 150.53 L8.9 82.47 Q4 79 8.9 75.53 L105.1 7.47 Q110 4 114.9 7.47 Z';
const experienceOptions: { value: Level; label: string; detail: string }[] = [
  { value: 'novice', label: 'Novice', detail: 'More guidance' },
  { value: 'bachelor', label: 'Bachelor’s', detail: 'Some design experience' },
  { value: 'master', label: 'Master’s', detail: 'Experienced designer' },
];

function iterationLabel(index: number) {
  const words = ['Zero', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  const suffix = index % 100 >= 11 && index % 100 <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'} as Record<number,string>)[index % 10] ?? 'th';
  return words[index] ? words[index] + ' iteration' : index + suffix + ' iteration';
}

function durationLabel(minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 1) return 'Choose your availability and session count';
  const hours = Math.floor(minutes / 60), remainder = minutes % 60;
  return hours ? `${hours} ${hours === 1 ? 'hour' : 'hours'}${remainder ? ` ${remainder} min` : ''}` : `${minutes} min`;
}

export function ProjectIntake({ initial, initialName = '', initialDescription = '', goalOnly = false, busy, onSubmit, onCancel, error }: ProjectIntakeProps) {
  const formId = useId();
  const firstPhase = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [input, setInput] = useState<ProgrammeInput>(() => initial ? { ...initial, diamonds: initial.diamonds.map(diamond => ({ ...diamond, phases: [...diamond.phases] })) } : {
    goal: '',
    diamonds: [{ id: 'diamond-1', phases: [] }, { id: 'diamond-2', phases: [] }],
    participants: 4,
    level: 'bachelor',
    hours: 14,
    timeMode: 'weekly',
    weeks: 4,
    sessionsPerWeek: 3,
    sessionCount: 12,
    countMode: 'calculated',
  });
  const [localError, setLocalError] = useState('');
  const duration = Math.round(input.hours * 60 * (input.timeMode === 'weekly' ? input.weeks ?? 1 : 1) / input.sessionCount);
  const validDuration = Number.isFinite(duration) && duration >= 10 && duration <= 720;
  const message = localError || error;
  const phaseInvalid = localError === phaseRequiredMessage;

  function update<K extends keyof ProgrammeInput>(key: K, value: ProgrammeInput[K]) {
    setInput(previous => ({ ...previous, [key]: value }));
    setLocalError('');
  }

  function updateSchedule(key: 'weeks' | 'sessionsPerWeek', value: number | null) {
    setInput(previous => {
      const next = { ...previous, [key]: value };
      if (value === null) next.countMode = 'manual';
      if (next.countMode === 'calculated' && next.weeks !== null && next.sessionsPerWeek !== null) {
        const calculated = next.weeks * next.sessionsPerWeek;
        if (Number.isInteger(calculated) && calculated >= 1 && calculated <= 120) next.sessionCount = calculated;
      }
      return next;
    });
    setLocalError('');
  }

  function recalculate() {
    if (input.weeks === null || input.sessionsPerWeek === null) {
      setLocalError('Enter weeks and sessions per week to calculate the number of sessions.');
      return;
    }
    const count = input.weeks * input.sessionsPerWeek;
    if (!Number.isInteger(count) || count < 1 || count > 120) {
      setLocalError('Weeks × sessions per week must give between 1 and 120 whole sessions. You can also set the session count directly.');
      return;
    }
    setInput(previous => ({ ...previous, sessionCount: count, countMode: 'calculated' }));
    setLocalError('');
  }

  function togglePhase(cycleId: string, phase: Phase) {
    setInput(previous => ({ ...previous, diamonds: previous.diamonds.map(diamond => diamond.id === cycleId ? { ...diamond, phases: diamond.phases.includes(phase) ? diamond.phases.filter(value => value !== phase) : [...diamond.phases, phase] } : diamond) }));
    setLocalError('');
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!goalOnly && !name.trim()) { setLocalError('Give your project a name.'); return; }
    if (!input.goal.trim()) { setLocalError('Describe what you want to achieve with this goal.'); return; }
    if (!input.diamonds.some(diamond => diamond.phases.length > 0)) {
      setLocalError(phaseRequiredMessage);
      requestAnimationFrame(() => firstPhase.current?.focus());
      return;
    }
    if (!Number.isInteger(input.sessionCount) || input.sessionCount < 1 || input.sessionCount > 120) { setLocalError('Choose between 1 and 120 whole sessions.'); return; }
    if (!validDuration) { setLocalError('Adjust your availability or session count so each initial session is between 10 minutes and 12 hours.'); return; }
    const checked = programmeInputSchema.safeParse({ ...input, goal: input.goal.trim() });
    if (!checked.success) { setLocalError(checked.error.issues[0]?.message || 'Check your planning settings.'); return; }
    onSubmit(name.trim(), description.trim(), checked.data);
  }

  return <form className={`programme-intake${goalOnly ? ' programme-intake-compact' : ''}`} onSubmit={submit} aria-busy={busy}>
    <fieldset className="programme-form-fields" disabled={busy}>
      <section className="programme-phase-column" aria-label="Design process selection">
      <div className="programme-phase-panel">
      <fieldset className="programme-phases" aria-invalid={phaseInvalid || undefined} aria-describedby={`${formId}-phase-help${phaseInvalid ? ` ${formId}-error` : ''}`}>
        <legend>Which phases will you work through?</legend>
        <p id={`${formId}-phase-help`} className="programme-helper">Select the halves you need. Add a diamond to revisit developing and delivering.</p>
        <div className="programme-diamond-list">
          {input.diamonds.map((diamond, index) => <div className="programme-diamond-item" key={diamond.id}>
            <span className="programme-diamond-caption">{index === 0 ? 'Understand the problem' : index === 1 ? 'Explore the solution' : iterationLabel(index)}</span>
            <div className="programme-diamond" role="group" aria-label={`Diamond ${index + 1}`}>
              <svg className="programme-diamond-outline" viewBox="0 0 220 158" aria-hidden="true">
                <defs>
                  <clipPath id={`${formId}-shape-${index}`}><path d={diamondPath} /></clipPath>
                  <clipPath id={`${formId}-left-${index}`}><rect width="110" height="158" /></clipPath>
                  <clipPath id={`${formId}-right-${index}`}><rect x="110" width="110" height="158" /></clipPath>
                </defs>
                <g clipPath={`url(#${formId}-shape-${index})`}>
                  {(index === 0 ? ['discover', 'define'] as const : ['develop', 'deliver'] as const).map((phase, half) => <rect key={phase} x={half * 110} width="110" height="158" className={`diamond-fill${diamond.phases.includes(phase) ? ' selected' : ''}`} />)}
                </g>
                <path className="diamond-outline" d={diamondPath} />
                {(index === 0 ? ['discover', 'define'] as const : ['develop', 'deliver'] as const).map((phase, half) => diamond.phases.includes(phase) ? <path key={phase} className="diamond-outline selected" d={diamondPath} clipPath={`url(#${formId}-${half === 0 ? 'left' : 'right'}-${index})`} /> : null)}
                <path className={`diamond-outline diamond-divider${diamond.phases.length ? ' selected' : ''}`} d="M110 5.73 V152.27" />
              </svg>
              {(index === 0 ? ['discover', 'define'] as const : ['develop', 'deliver'] as const).map((phase, half) => <button key={phase} ref={index === 0 && half === 0 ? firstPhase : undefined} type="button" className={`programme-diamond-half ${half === 0 ? 'first-half' : 'second-half'}${diamond.phases.includes(phase) ? ' selected' : ''}`} aria-pressed={diamond.phases.includes(phase)} aria-label={`${phaseNames[phase]}, diamond ${index + 1}`} aria-describedby={phaseInvalid ? `${formId}-error` : undefined} onClick={() => togglePhase(diamond.id, phase)}>
                <span>{phaseNames[phase]}<small>{diamond.phases.includes(phase) ? 'Selected' : 'Select'}</small></span>
              </button>)}
            </div>
          </div>)}
          <button type="button" className="programme-add-diamond" disabled={input.diamonds.length >= 30} onClick={() => setInput(previous => ({ ...previous, diamonds: [...previous.diamonds, { id: crypto.randomUUID(), phases: [] }] }))}><span aria-hidden="true">+</span>Add diamond</button>
        </div>
      </fieldset>
      </div>
        {!goalOnly ? <div className="programme-phase-intro"><h1>Make room for better design work.</h1><p>Choose the phases your project needs, then tell us about your goal, your team and the time you have.</p></div> : null}
      </section>
      <div className="programme-form-column">
    <div className="programme-intake-heading"><h2>{goalOnly ? 'Add a new goal' : 'Plan your project'}</h2><p>{goalOnly ? 'Give this goal its own phases and sessions.' : 'Start with your goal, then make room for the sessions.'}</p></div>
      {!goalOnly ? <div className="programme-identity-fields">
        <label className="field" htmlFor={`${formId}-name`}>Project name<input id={`${formId}-name`} autoFocus required maxLength={120} value={name} placeholder="What are you working on?" onChange={event => setName(event.target.value)} /></label>
        <label className="field" htmlFor={`${formId}-description`}>Project description<textarea id={`${formId}-description`} rows={2} maxLength={1500} value={description} placeholder="A little context about the project" onChange={event => setDescription(event.target.value)} /></label>
      </div> : null}
      <label className="field" htmlFor={`${formId}-goal`}>What do you want to achieve?<textarea id={`${formId}-goal`} autoFocus={goalOnly} required rows={goalOnly ? 3 : 2} maxLength={2000} value={input.goal} onChange={event => update('goal', event.target.value)} placeholder="For example: explore ways to make daily commuting easier" /></label>

      <section className="programme-availability" aria-labelledby={`${formId}-availability`}>
        <div><h3 id={`${formId}-availability`}>Make time for the work</h3><p className="programme-helper">Availability sets an initial length for each session. You can change individual sessions later.</p></div>
        <div className="programme-two-fields">
          <label className="field" htmlFor={`${formId}-hours`}>Available hours<input id={`${formId}-hours`} type="number" min={0.1} max={1440} step="any" required value={input.hours || ''} onChange={event => update('hours', Number(event.target.value))} /></label>
          <fieldset className="programme-time-mode"><legend>Availability applies</legend><div className="programme-segmented"><label className={input.timeMode === 'weekly' ? 'selected' : ''}><input type="radio" name={`${formId}-time-mode`} checked={input.timeMode === 'weekly'} onChange={() => update('timeMode', 'weekly')} />Per week</label><label className={input.timeMode === 'total' ? 'selected' : ''}><input type="radio" name={`${formId}-time-mode`} checked={input.timeMode === 'total'} onChange={() => update('timeMode', 'total')} />In total</label></div></fieldset>
        </div>
        <div className="programme-two-fields">
          <label className="field" htmlFor={`${formId}-weeks`}>Weeks <span className="optional">optional helper</span><input id={`${formId}-weeks`} type="number" min={1} max={520} step={1} value={input.weeks ?? ''} onChange={event => updateSchedule('weeks', event.target.value === '' ? null : Number(event.target.value))} /></label>
          <label className="field" htmlFor={`${formId}-frequency`}>Sessions per week <span className="optional">optional helper</span><input id={`${formId}-frequency`} type="number" min={1} max={120} step={1} value={input.sessionsPerWeek ?? ''} onChange={event => updateSchedule('sessionsPerWeek', event.target.value === '' ? null : Number(event.target.value))} /></label>
        </div>
        <div className="programme-count-row"><label className="field" htmlFor={`${formId}-count`}>Number of sessions<input id={`${formId}-count`} type="number" min={1} max={120} step={1} required value={input.sessionCount || ''} aria-describedby={`${formId}-count-help`} onChange={event => { setInput(previous => ({ ...previous, sessionCount: Number(event.target.value), countMode: 'manual' })); setLocalError(''); }} /></label><button type="button" className="button" onClick={recalculate}>Recalculate from schedule</button></div>
        <p className="programme-helper" id={`${formId}-count-help`}>{input.countMode === 'manual' ? 'Your session count is fixed. Changing the schedule helpers keeps this count until you choose Recalculate.' : 'Calculated from weeks × sessions per week. Edit the count directly whenever you need to.'}</p>
        <p className={`programme-duration${validDuration ? '' : ' invalid'}`} role="status"><span>Initial length per session</span><strong>{durationLabel(duration)}</strong>{!validDuration ? <small>Choose between 10 minutes and 12 hours per session.</small> : null}</p>
        <p className="programme-helper">Breaks and energizers are included in session planning.{input.timeMode === 'weekly' && input.weeks === null ? ' With no weeks entered, one week’s availability is divided across your sessions.' : ''}</p>
      </section>
      <div className="programme-two-fields programme-team-fields">
        <label className="field" htmlFor={`${formId}-participants`}>Participants<input id={`${formId}-participants`} required type="number" min={1} max={100} step={1} value={input.participants || ''} onChange={event => update('participants', Number(event.target.value))} /></label>
        <fieldset className="programme-experience"><legend>Designer experience</legend><div className="programme-experience-options">{experienceOptions.map(option => <label key={option.value} className={input.level === option.value ? 'selected' : ''}><input type="radio" name={`${formId}-level`} value={option.value} checked={input.level === option.value} onChange={() => update('level', option.value)} /><span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}</div></fieldset>
      </div>
    {message ? <p id={`${formId}-error`} className="notice danger" role="alert">{message}</p> : null}
    <div className="programme-actions"><button className="button" type="button" onClick={onCancel} disabled={busy}>Cancel</button><button className="button primary" type="submit" disabled={busy}>{busy ? 'Planning sessions…' : goalOnly ? 'Add goal & plan sessions' : 'Create project & plan sessions'}</button></div>
      </div>
    </fieldset>
  </form>;
}

export default ProjectIntake;
