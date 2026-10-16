"use client";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-ink-100 rounded px-3 py-2 text-sm bg-white focus:border-signal ${props.className || ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (  
    <textarea
      {...props}
      className={`w-full border border-ink-100 rounded px-3 py-2 text-sm bg-white focus:border-signal resize-y ${props.className || ""}`}
    />
  );
}

export function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="text-ink-500 hover:text-ink-900 text-xs px-2 py-1 rounded hover:bg-ink-50"
    >
      {children}
    </button>
  );
}
