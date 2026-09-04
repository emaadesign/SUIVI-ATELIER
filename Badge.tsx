const STYLES: Record<string, string> = {
  ok: 'bg-sage-light text-sage',
  bas: 'bg-mustard-light text-mustard',
  critique: 'bg-clay/15 text-clay',
  neutre: 'bg-rose-light text-plum'
}

export default function Badge({ tone = 'neutre', children }: { tone?: keyof typeof STYLES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[tone]}`}>
      {children}
    </span>
  )
}
