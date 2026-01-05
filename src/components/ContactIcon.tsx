type ContactIconType = 'phone' | 'email' | 'wechat' | 'location' | 'github' | 'website';

const IconBase = ({
  children,
  title
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <svg
    className="contact-icon"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : 'presentation'}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

export const ContactIcon = ({ type }: { type: ContactIconType }) => {
  if (type === 'phone') {
    return (
      <IconBase title="Phone">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.06a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
      </IconBase>
    );
  }

  if (type === 'email') {
    return (
      <IconBase title="Email">
        <path d="M4 4h16v16H4z" />
        <path d="m22 6-10 7L2 6" />
      </IconBase>
    );
  }

  if (type === 'wechat') {
    return (
      <IconBase title="WeChat">
        <path d="M21 15a4 4 0 0 1-4 4H9l-4 3v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4z" />
        <path d="M7 11V9a4 4 0 0 1 4-4h6" />
      </IconBase>
    );
  }

  if (type === 'location') {
    return (
      <IconBase title="Location">
        <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z" />
        <circle cx="12" cy="11" r="2" />
      </IconBase>
    );
  }

  if (type === 'github') {
    return (
      <IconBase title="GitHub">
        <path d="M9 19c-4 1.5-4-2.5-5-3m10 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 18 4.77 5.07 5.07 0 0 0 17.91 1S16.73.65 14 2.48a13.38 13.38 0 0 0-5 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </IconBase>
    );
  }

  if (type === 'website') {
    return (
      <IconBase title="Website">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </IconBase>
    );
  }

  return null;
};

export type { ContactIconType };


