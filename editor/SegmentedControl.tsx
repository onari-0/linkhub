type Option<Value extends string> = { value: Value; label: string };
type Props<Value extends string> = {
  label: string;
  value: NoInfer<Value>;
  options: readonly Option<Value>[];
  onChange(value: NoInfer<Value>): void;
  describedBy?: string;
};

export function SegmentedControl<Value extends string>({ label, value, options, onChange, describedBy }: Props<Value>) {
  return <div className="mode-switch" role="group" aria-label={label} aria-describedby={describedBy}>
    {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value}
      onClick={() => { if (value !== option.value) onChange(option.value); }}>{option.label}</button>)}
  </div>;
}
