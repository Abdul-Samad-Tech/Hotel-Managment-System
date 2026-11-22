export function Input({ id, label, className = "", ...props }) {
  return (
    <div className={className}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          className="peer h-14 w-full border-b border-navy/15 bg-transparent pt-5 text-sm text-navy outline-none placeholder:text-transparent focus:border-b-2 focus:border-gold"
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-1/2 left-0 origin-left -translate-y-1/2 text-sm text-navy/45 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.82] peer-[:not(:placeholder-shown)]:-translate-y-[1.15rem] peer-[:not(:placeholder-shown)]:scale-[0.82]"
        >
          {label}
        </label>
      </div>
    </div>
  );
}
