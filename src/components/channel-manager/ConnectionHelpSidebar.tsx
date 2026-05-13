interface ConnectionHelpSidebarProps {
  channelName: string
}

export function ConnectionHelpSidebar({ channelName }: ConnectionHelpSidebarProps) {
  return (
    <aside className="w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#f6f9fc] p-6 shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
        <svg className="w-6 h-6 text-[#717680]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10.5V16.5" />
          <circle cx="12" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <h3 className="mt-4 text-[16px] leading-6 font-semibold text-[#414651]">Need help connecting?</h3>

      <div className="mt-3 text-[14px] leading-5 text-[#414651]">
        <p>You&apos;ll find the required connection details in your {channelName} account settings.</p>
        <p className="mt-3">If you&apos;re not sure what to use, follow this quick checklist:</p>
        <ol className="mt-3 list-decimal pl-5 space-y-1">
          <li>Log in to your {channelName} account dashboard.</li>
          <li>Open account/company settings and locate connection credentials.</li>
          <li>Copy the value and paste it into the field on the left.</li>
        </ol>
      </div>
    </aside>
  )
}
